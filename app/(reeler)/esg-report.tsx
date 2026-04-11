import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

function MetricCard({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIconBox}>
        <Ionicons name={icon as any} size={20} color={C.greenText} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {sub ? <Text style={styles.metricSub}>{sub}</Text> : null}
    </View>
  );
}

export default function ESGReportScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ESG Impact Report</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Reporting period */}
        <View style={styles.periodCard}>
          <Ionicons name="calendar-outline" size={16} color={C.textSecondary} />
          <Text style={styles.periodText}>Calendar Year 2024</Text>
        </View>

        {/* ESG Metrics */}
        <Text style={styles.sectionLabel}>ENVIRONMENTAL IMPACT</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            icon="leaf-outline"
            label="Silk Pupae Collected"
            value="4,280 kg"
            sub="Total supplied to factory"
          />
          <MetricCard
            icon="earth-outline"
            label="Waste Diverted"
            value="3,850 kg"
            sub="Pupae diverted from waste stream"
          />
        </View>

        <Text style={styles.sectionLabel}>SOCIAL IMPACT</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            icon="trending-up-outline"
            label="Income Growth"
            value="+23%"
            sub="Year-over-year"
          />
          <MetricCard
            icon="resize-outline"
            label="Farm Area Enrolled"
            value="2.5 ha"
            sub="Under active collection"
          />
        </View>

        {/* Download certificate */}
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={() => alert('ESG Certificate download coming soon.')}
          activeOpacity={0.85}
        >
          <Ionicons name="ribbon-outline" size={18} color={C.white} />
          <Text style={styles.downloadBtnText}>Download ESG Certificate</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          ESG metrics are computed from your verified collection records and may differ slightly from final audited figures.
        </Text>
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

  periodCard: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    backgroundColor: C.surfaceAlt, borderRadius: R.lg,
    padding: S.md, marginBottom: S.xl,
  },
  periodText: { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary },

  sectionLabel: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 1, marginBottom: S.md, marginTop: S.sm,
  },

  metricsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginBottom: S.lg,
  },
  metricCard: {
    flex: 1, minWidth: 140, backgroundColor: C.greenBg,
    borderRadius: R.lg, padding: S.md, borderWidth: 1,
    borderColor: C.greenText,
  },
  metricIconBox: { marginBottom: S.sm },
  metricLabel: { fontSize: T.xs, fontWeight: T.bold, color: C.greenText, letterSpacing: 0.5, marginBottom: S.xs },
  metricValue: { fontSize: T['3xl'], fontWeight: T.extrabold, color: C.greenText, marginBottom: 2 },
  metricSub: { fontSize: T.base, color: C.greenText },

  downloadBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: S.sm, marginTop: S.md,
  },
  downloadBtnText: { color: C.white, fontSize: T.lg, fontWeight: T.bold },

  disclaimer: {
    fontSize: T.base, color: C.textMuted, textAlign: 'center',
    marginTop: S.xl, lineHeight: 18, paddingHorizontal: S.base,
  },
});
