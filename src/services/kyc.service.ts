/**
 * kyc.service.ts — Silk Value Platform
 * Handles KYC document upload to Supabase Storage and profile status updates.
 *
 * Storage path pattern:
 *   kyc-documents/{userId}/{documentType}_{timestamp}.{ext}
 *
 * NOTE: This service intentionally avoids any picker library.
 *       File selection is handled in the UI layer (platform-aware).
 *       Pass a { uri, name, type } object from expo-camera/image-picker on
 *       native, or a browser File object (cast to KycFile) on web.
 */

import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KycFile {
  /** On web: File object URI (blob: URL) or base64 data URI.
   *  On native: expo file:// URI.             */
  uri: string;
  /** Original file name, e.g. "aadhaar_front.jpg" */
  name: string;
  /** MIME type, e.g. "image/jpeg" or "application/pdf" */
  type: string;
  /** File size in bytes — required for the 3 MB guard */
  size: number;
}

export type KycDocumentType = 'aadhaar_front' | 'aadhaar_back' | 'bank_document';

export class KycUploadError extends Error {
  constructor(
    message: string,
    public readonly code: 'file_too_large' | 'offline' | 'bucket_missing' | 'upload_failed' | 'update_failed',
  ) {
    super(message);
    this.name = 'KycUploadError';
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BUCKET          = 'kyc-documents';
const MAX_FILE_BYTES  = 3 * 1024 * 1024; // 3 MB

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extension(mimeType: string): string {
  if (mimeType.includes('pdf'))  return 'pdf';
  if (mimeType.includes('png'))  return 'png';
  if (mimeType.includes('webp')) return 'webp';
  return 'jpg'; // default for image/jpeg and unknown
}

async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true;
  } catch {
    return true; // optimistic — let the upload attempt decide
  }
}

/**
 * Converts a file URI/File object to an ArrayBuffer for uploading.
 * On web: fetches the blob URL or reads the File directly.
 * On native: reads the base64-encoded file via expo-file-system.
 */
async function toArrayBuffer(file: KycFile): Promise<ArrayBuffer> {
  if (Platform.OS === 'web') {
    // On web, uri is either a blob: URL (from createObjectURL) or a
    // data: URL. fetch() handles both.
    const resp = await fetch(file.uri);
    return resp.arrayBuffer();
  } else {
    // Native: read with expo-file-system (already installed)
    const FileSystem = await import('expo-file-system');
    const base64 = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    // Convert base64 → ArrayBuffer
    const binary = atob(base64);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Uploads a single KYC document to Supabase Storage.
 *
 * @param userId       Auth user UUID (from supabase.auth.getUser())
 * @param file         Platform-normalised file descriptor (see KycFile)
 * @param documentType One of aadhaar_front | aadhaar_back | bank_document
 * @returns            Storage path that was written (for saving in the DB)
 * @throws             KycUploadError with a user-readable message
 */
export async function uploadKycDocument(
  userId: string,
  file: KycFile,
  documentType: KycDocumentType,
): Promise<string> {
  // ── Guard: file size ───────────────────────────────────────────────────────
  if (file.size > MAX_FILE_BYTES) {
    throw new KycUploadError('File must be under 3MB', 'file_too_large');
  }

  // ── Guard: connectivity ────────────────────────────────────────────────────
  const online = await isOnline();
  if (!online) {
    throw new KycUploadError('Upload failed — check connection', 'offline');
  }

  // ── Build storage path ─────────────────────────────────────────────────────
  const timestamp = Date.now();
  const ext       = extension(file.type);
  const storagePath = `${userId}/${documentType}_${timestamp}.${ext}`;

  // ── Perform upload ─────────────────────────────────────────────────────────
  let fileBody: ArrayBuffer;
  try {
    fileBody = await toArrayBuffer(file);
  } catch {
    throw new KycUploadError('Upload failed — check connection', 'upload_failed');
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBody, {
      contentType: file.type,
      upsert:      true,          // safe to re-upload same document type
    });

  if (error) {
    // Bucket not found — the storage bucket hasn't been created yet
    if (
      error.message?.toLowerCase().includes('bucket') ||
      error.message?.toLowerCase().includes('not found') ||
      (error as any).statusCode === 404
    ) {
      throw new KycUploadError('Upload unavailable — contact support', 'bucket_missing');
    }
    // Any other connectivity / auth error
    if (
      error.message?.toLowerCase().includes('network') ||
      error.message?.toLowerCase().includes('fetch')
    ) {
      throw new KycUploadError('Upload failed — check connection', 'offline');
    }
    throw new KycUploadError('Upload failed — check connection', 'upload_failed');
  }

  return storagePath;
}

/**
 * Persists the uploaded document paths to the reeler's profile row and
 * advances `kyc_status` to 'submitted' (unless already 'verified').
 *
 * @param profileId     Profile UUID (profiles.id, not auth user UUID)
 * @param documentPaths Map of documentType → storagePath
 */
export async function updateKycStatus(
  profileId: string,
  documentPaths: Partial<Record<KycDocumentType, string>>,
): Promise<void> {
  // Build the JSONB array entry for each uploaded document
  const docs = Object.entries(documentPaths).map(([type, path]) => ({
    type,
    path,
    uploaded_at: new Date().toISOString(),
  }));

  // Fetch existing kyc_documents so we can append / merge
  const { data: existing, error: fetchErr } = await supabase
    .from('profiles')
    .select('kyc_status, kyc_documents')
    .eq('id', profileId)
    .single();

  if (fetchErr) {
    throw new KycUploadError('Upload failed — check connection', 'update_failed');
  }

  // Merge: keep existing docs for types not being updated
  const currentDocs: Array<{ type: string; path: string; uploaded_at: string }> =
    Array.isArray(existing?.kyc_documents) ? existing.kyc_documents : [];
  const existingTypes = new Set(docs.map(d => d.type));
  const merged = [
    ...currentDocs.filter(d => !existingTypes.has(d.type)),
    ...docs,
  ];

  // Only advance to 'submitted' — never overwrite 'verified'
  const newStatus = existing?.kyc_status === 'verified' ? 'verified' : 'submitted';

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({
      kyc_documents: merged,
      kyc_status:    newStatus,
    })
    .eq('id', profileId);

  if (updateErr) {
    throw new KycUploadError('Upload failed — check connection', 'update_failed');
  }
}
