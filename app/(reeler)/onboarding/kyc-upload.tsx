import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import {
  uploadKycDocument,
  updateKycStatus,
  KycUploadError,
  type KycFile,
  type KycDocumentType,
} from '@/services/kyc.service';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

// ─── Types ────────────────────────────────────────────────────────────────────

interface DocState {
  file:     KycFile | null;
  progress: number;          // 0–100 while uploading, 100 when done
  path:     string | null;   // storage path returned after upload
  error:    string | null;
}

const INITIAL_DOC: DocState = { file: null, progress: 0, path: null, error: null };

// ─── Upload tile ─────────────────────────────────────────────────────────────

interface UploadTileProps {
  label:       string;
  state:       DocState;
  isUploading: boolean;
  onPick:      () => void;
}

function UploadTile({ label, state, isUploading, onPick }: UploadTileProps) {
  const done    = state.path !== null;
  const loading = isUploading && state.progress < 100;

  return (
    <TouchableOpacity
      style={[styles.uploadTile, done && styles.uploadTileDone, !!state.error && styles.uploadTileError]}
      onPress={onPick}
      disabled={isUploading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={C.black} />
      ) : (
        <Ionicons
          name={done ? 'checkmark-circle' : state.error ? 'alert-circle-outline' : 'cloud-upload-outline'}
          size={28}
          color={done ? C.greenText : state.error ? C.redText : C.textMuted}
        />
      )}

      <Text style={[styles.uploadLabel, done && { color: C.greenText }, !!state.error && { color: C.redText }]}>
        {label}
      </Text>

      {loading ? (
        <Text style={styles.uploadProgress}>{state.progress}%</Text>
      ) : done ? (
        <Text style={[styles.uploadHint, { color: C.greenText }]}>Uploaded ✓</Text>
      ) : state.error ? (
        <Text style={[styles.uploadHint, { color: C.redText }]} numberOfLines={2}>{state.error}</Text>
      ) : (
        <Text style={styles.uploadHint}>{state.file ? state.file.name : 'Tap to upload'}</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Web-only: hidden file input helper ──────────────────────────────────────

/**
 * Opens a native file picker on web using a temporary <input type="file"> element.
 * Returns a normalised KycFile or null if the user cancelled.
 */
function pickFileOnWeb(accept: string): Promise<KycFile | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type   = 'file';
    input.accept = accept;
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) { resolve(null); return; }
      const uri = URL.createObjectURL(f);
      resolve({ uri, name: f.name, type: f.type || 'image/jpeg', size: f.size });
    };
    // Cancelled — resolve null after a short delay if no change event
    input.oncancel = () => resolve(null);
    input.click();
  });
}

/**
 * On native: expo-image-picker is not currently installed.
 * Returns a stubbed KycFile so the upload flow can be exercised in dev.
 * Replace this with a real picker call when expo-image-picker is added.
 */
async function pickFileOnNative(): Promise<KycFile | null> {
  // TODO: replace with expo-image-picker or expo-document-picker when installed
  // import * as ImagePicker from 'expo-image-picker';
  // const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images' });
  // if (result.canceled) return null;
  // const asset = result.assets[0];
  // return { uri: asset.uri, name: asset.fileName ?? 'doc.jpg', type: asset.mimeType ?? 'image/jpeg', size: asset.fileSize ?? 0 };
  return null; // remove once picker is installed
}

async function pickFile(): Promise<KycFile | null> {
  if (Platform.OS === 'web') {
    return pickFileOnWeb('image/*,application/pdf');
  }
  return pickFileOnNative();
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

const DOC_KEYS: KycDocumentType[] = ['aadhaar_front', 'aadhaar_back', 'bank_document'];

export default function KYCUploadScreen() {
  const [docs, setDocs] = useState<Record<KycDocumentType, DocState>>({
    aadhaar_front: { ...INITIAL_DOC },
    aadhaar_back:  { ...INITIAL_DOC },
    bank_document: { ...INITIAL_DOC },
  });
  const [aadhaarLast4, setAadhaarLast4] = useState('');
  const [isUploading, setIsUploading]   = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);

  // Track which doc is currently mid-upload for progress display
  const [uploadingKey, setUploadingKey] = useState<KycDocumentType | null>(null);

  const allUploaded = DOC_KEYS.every(k => docs[k].path !== null);

  // ── File pick ──────────────────────────────────────────────────────────────

  const handlePick = async (key: KycDocumentType) => {
    const file = await pickFile();
    if (!file) return;

    // Validate size before touching state
    if (file.size > 3 * 1024 * 1024) {
      setDocs(prev => ({
        ...prev,
        [key]: { ...prev[key], error: 'File must be under 3MB', file: null },
      }));
      return;
    }

    setDocs(prev => ({
      ...prev,
      [key]: { file, progress: 0, path: null, error: null },
    }));
  };

  // ── Submit — upload all picked files then update profile ───────────────────

  const handleSubmit = async () => {
    if (!allUploaded) return;
    if (aadhaarLast4.length !== 4) return;
    setSubmitError(null);
    setIsUploading(true);

    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new KycUploadError('Upload failed — check connection', 'upload_failed');

      // Get profile ID (different from auth user ID)
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (profileErr || !profileData) throw new KycUploadError('Upload failed — check connection', 'upload_failed');

      const paths: Partial<Record<KycDocumentType, string>> = {};

      // Upload each doc sequentially so progress is legible
      for (const key of DOC_KEYS) {
        const docState = docs[key];
        if (!docState.file) continue;

        setUploadingKey(key);

        // Simulate progress ticks — Supabase JS v2 doesn't expose upload progress
        // so we animate 0→80 while the upload runs, then jump to 100 on success.
        const progressInterval = setInterval(() => {
          setDocs(prev => {
            const current = prev[key].progress;
            if (current >= 80) { clearInterval(progressInterval); return prev; }
            return { ...prev, [key]: { ...prev[key], progress: current + 10 } };
          });
        }, 150);

        try {
          const storagePath = await uploadKycDocument(user.id, docState.file, key);
          clearInterval(progressInterval);
          paths[key] = storagePath;
          setDocs(prev => ({ ...prev, [key]: { ...prev[key], progress: 100, path: storagePath, error: null } }));
        } catch (err) {
          clearInterval(progressInterval);
          const msg = err instanceof KycUploadError ? err.message : 'Upload failed — check connection';
          setDocs(prev => ({ ...prev, [key]: { ...prev[key], progress: 0, error: msg } }));
          // Continue to next file — don't abort the whole batch on one failure
        }
      }

      setUploadingKey(null);

      // If at least the identity docs uploaded, save and proceed
      const uploaded = Object.keys(paths) as KycDocumentType[];
      if (uploaded.length === 0) {
        setSubmitError('All uploads failed — check your connection and try again.');
        return;
      }

      await updateKycStatus(profileData.id, paths);
      router.push('/(reeler)/onboarding/kyc-pending');

    } catch (err) {
      const msg = err instanceof KycUploadError ? err.message : 'Upload failed — check connection';
      setSubmitError(msg);
    } finally {
      setIsUploading(false);
      setUploadingKey(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const submitDisabled = isUploading || !allUploaded || aadhaarLast4.length !== 4;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          disabled={isUploading}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Upload</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step 2/3 */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={styles.stepDot} />
          <Text style={styles.stepText}>Step 2 of 3</Text>
        </View>

        <Text style={styles.instructions}>
          Upload clear photos of your Aadhaar card (front & back) and bank passbook/cancelled cheque.
          Maximum 3 MB per file.
        </Text>

        <View style={styles.tilesRow}>
          <UploadTile
            label="Aadhaar Front"
            state={docs.aadhaar_front}
            isUploading={isUploading && uploadingKey === 'aadhaar_front'}
            onPick={() => handlePick('aadhaar_front')}
          />
          <UploadTile
            label="Aadhaar Back"
            state={docs.aadhaar_back}
            isUploading={isUploading && uploadingKey === 'aadhaar_back'}
            onPick={() => handlePick('aadhaar_back')}
          />
        </View>

        <UploadTile
          label="Bank Passbook / Cancelled Cheque"
          state={docs.bank_document}
          isUploading={isUploading && uploadingKey === 'bank_document'}
          onPick={() => handlePick('bank_document')}
        />

        <Text style={styles.label}>AADHAAR LAST 4 DIGITS</Text>
        <TextInput
          style={styles.input}
          value={aadhaarLast4}
          onChangeText={(t) => setAadhaarLast4(t.replace(/\D/g, '').slice(0, 4))}
          placeholder="1234"
          placeholderTextColor={C.textMuted}
          keyboardType="numeric"
          maxLength={4}
          editable={!isUploading}
        />
        <Text style={styles.hint}>We never store your full Aadhaar number.</Text>
      </ScrollView>

      <View style={styles.footer}>
        {/* Inline error — shown below button, no modal/alert */}
        {submitError ? (
          <Text style={styles.inlineError}>{submitError}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.submitBtn, submitDisabled && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitDisabled}
          activeOpacity={0.85}
        >
          {isUploading ? (
            <View style={styles.submitBtnInner}>
              <ActivityIndicator size="small" color={C.white} style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Uploading…</Text>
            </View>
          ) : (
            <Text style={styles.submitBtnText}>Submit KYC</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { flex: 1, fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary, textAlign: 'center' },

  scrollContent: { padding: S.xl, paddingBottom: S['3xl'] },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginBottom: S.xl },
  stepDot: { width: 32, height: 4, borderRadius: 2, backgroundColor: C.border },
  stepDotActive: { backgroundColor: C.black },
  stepText: { fontSize: T.base, color: C.textMuted, marginLeft: S.sm },

  instructions: { fontSize: T.md, color: C.textSecondary, lineHeight: 22, marginBottom: S.xl },

  tilesRow: { flexDirection: 'row', gap: S.sm, marginBottom: S.sm },
  uploadTile: {
    flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    padding: S.lg, alignItems: 'center', gap: S.sm,
    borderStyle: 'dashed', backgroundColor: C.surfaceAlt,
    marginBottom: S.sm,
  },
  uploadTileDone: {
    borderColor: C.greenText, borderStyle: 'solid', backgroundColor: C.greenBg,
  },
  uploadTileError: {
    borderColor: C.redText, borderStyle: 'solid', backgroundColor: C.redBg,
  },
  uploadLabel: { fontSize: T.base, fontWeight: T.semibold, color: C.textPrimary, textAlign: 'center' },
  uploadHint: { fontSize: T.xs, color: C.textMuted, textAlign: 'center' },
  uploadProgress: { fontSize: T.sm, fontWeight: T.bold, color: C.textPrimary },

  label: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 0.8, marginBottom: S.sm, marginTop: S.xl,
  },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingHorizontal: S.md, paddingVertical: 14,
    fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary,
    letterSpacing: 8, textAlign: 'center',
  },
  hint: { fontSize: T.base, color: C.textMuted, marginTop: S.xs, textAlign: 'center' },

  footer: { paddingHorizontal: S.xl, paddingBottom: S.lg },
  inlineError: {
    fontSize: T.base, color: C.redText, textAlign: 'center',
    marginBottom: S.sm, lineHeight: 20,
  },
  submitBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 16, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.3 },
  submitBtnInner: { flexDirection: 'row', alignItems: 'center' },
  submitBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },
});
