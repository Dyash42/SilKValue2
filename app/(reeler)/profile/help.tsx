import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

const FAQ_ITEMS = [
  { q: 'How do I get paid for my cocoons?', a: 'When a collector visits your farm and weighs your cocoons, a collection ticket is created. Once the cocoons reach the factory and pass quality checks, payment is initiated to your registered UPI or bank account.' },
  { q: 'How long does payment take?', a: 'UPI payments are instant. Bank transfers take 1-2 business days. Weekly batch payments are processed every Friday.' },
  { q: 'What is the quality grading system?', a: 'Cocoons are graded A+ (premium), A, B, C, or Reject based on moisture content, shell quality, and pupae viability. Higher grades receive higher prices.' },
  { q: 'How do I update my bank details?', a: 'Go to Profile → Payment Methods → Add or edit your UPI ID or bank account details.' },
  { q: 'What does the QR code do?', a: 'Your QR code contains your unique reeler ID. Collectors scan it at your farm to quickly link the collection to your account.' },
  { q: 'Is my data safe?', a: 'Yes. We follow DPDP Act guidelines. Your Aadhaar number is never stored in full — only the last 4 digits. Bank details are masked. You can download or delete your data at any time from Profile → Consent & Privacy.' },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity style={styles.faqItem} onPress={() => setOpen(!open)} activeOpacity={0.7}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={C.textMuted} />
      </View>
      {open && <Text style={styles.faqAnswer}>{a}</Text>}
    </TouchableOpacity>
  );
}

export default function HelpScreen() {
  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/919876543210');
  };
  const handleEmail = () => {
    Linking.openURL('mailto:support@silkvalue.in');
  };
  const handleBugReport = () => {
    Linking.openURL('mailto:support@silkvalue.in?subject=Bug%20Report%20-%20Reeler%20App%20v1.2.0&body=Device:%20%0AOS:%20%0ADescription:%20');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={styles.faqList}>
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </View>

        <Text style={styles.sectionLabel}>CONTACT US</Text>
        <TouchableOpacity style={styles.contactRow} onPress={handleWhatsApp} activeOpacity={0.7}>
          <View style={[styles.contactIcon, { backgroundColor: C.greenBg }]}>
            <Ionicons name="logo-whatsapp" size={20} color={C.greenText} />
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactLabel}>WhatsApp Support</Text>
            <Text style={styles.contactDesc}>Chat with us on WhatsApp</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactRow} onPress={handleEmail} activeOpacity={0.7}>
          <View style={styles.contactIcon}>
            <Ionicons name="mail-outline" size={20} color={C.textPrimary} />
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactLabel}>Email Support</Text>
            <Text style={styles.contactDesc}>support@silkvalue.in</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactRow} onPress={handleBugReport} activeOpacity={0.7}>
          <View style={[styles.contactIcon, { backgroundColor: C.amberBg }]}>
            <Ionicons name="bug-outline" size={20} color={C.amberText} />
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactLabel}>Report a Bug</Text>
            <Text style={styles.contactDesc}>Includes app version and device info</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
        </TouchableOpacity>

        {/* App version */}
        <Text style={styles.versionText}>Version 1.2.0 (Build 20240110.1)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { flex: 1, fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary, textAlign: 'center' },

  scrollContent: { padding: S.base, paddingBottom: S['3xl'] },

  sectionLabel: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 1, marginBottom: S.md, marginTop: S.lg,
  },

  faqList: { borderWidth: 1, borderColor: C.border, borderRadius: R.lg, overflow: 'hidden' },
  faqItem: {
    paddingHorizontal: S.md, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.white,
  },
  faqHeader: { flexDirection: 'row', alignItems: 'center' },
  faqQuestion: { flex: 1, fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },
  faqAnswer: { fontSize: T.base, color: C.textSecondary, marginTop: S.sm, lineHeight: 20 },

  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    paddingVertical: S.md, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  contactIcon: {
    width: 40, height: 40, borderRadius: R.md,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  contactContent: { flex: 1 },
  contactLabel: { fontSize: T.md, fontWeight: T.medium, color: C.textPrimary, marginBottom: 2 },
  contactDesc: { fontSize: T.base, color: C.textSecondary },

  versionText: {
    fontSize: T.base, color: C.textMuted, textAlign: 'center',
    marginTop: S['3xl'], paddingBottom: S.lg,
  },
});
