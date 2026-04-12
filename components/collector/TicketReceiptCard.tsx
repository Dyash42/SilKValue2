import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

export interface TicketReceiptData {
  ticketId: string;
  dateTime: string;
  reelerName: string;
  village: string;
  grossKg: number;
  tareKg: number;
  netKg: number;
  grade: string;
  pricePerKg: number;
  totalAmount: number;
  paymentMode: string;
  isSynced: boolean;
}

function DashedLine() {
  return <View style={styles.dashed} />;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const fmt = (n: number) =>
  '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function TicketReceiptCard({ data }: { data: TicketReceiptData }) {
  return (
    <View style={styles.card}>
      <Text style={styles.brand}>SILK VALUE</Text>
      <Text style={styles.ticketId}>TICKET ID: #{data.ticketId}</Text>

      <DashedLine />

      <InfoRow label="DATE / TIME" value={data.dateTime} />
      <InfoRow label="REELER" value={data.reelerName} />
      <InfoRow label="VILLAGE" value={data.village} />

      <View style={styles.divider} />

      {/* Weight grid */}
      <View style={styles.weightGrid}>
        {[
          { label: 'GROSS', value: `${data.grossKg.toFixed(1)} kg` },
          { label: 'TARE', value: `${data.tareKg.toFixed(1)} kg` },
          { label: 'NET', value: `${data.netKg.toFixed(1)} kg` },
        ].map((col, i) => (
          <View key={col.label} style={[styles.weightCell, i < 2 ? styles.weightCellBorder : null]}>
            <Text style={styles.weightLabel}>{col.label}</Text>
            <Text style={styles.weightValue}>{col.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      {/* Grade pill */}
      <View style={styles.gradeRow}>
        <View style={styles.gradePill}>
          <Text style={styles.gradeText}>GRADE {data.grade}</Text>
        </View>
      </View>

      <InfoRow label="PRICE / KG" value={fmt(data.pricePerKg)} />
      <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
      <Text style={styles.totalValue}>{fmt(data.totalAmount)}</Text>
      <InfoRow label="PAYMENT" value={data.paymentMode} />

      <DashedLine />

      {/* Sync status */}
      <View style={styles.syncRow}>
        <View style={[styles.syncDot, { backgroundColor: data.isSynced ? C.green : C.amber }]} />
        <Text style={styles.syncText}>
          {data.isSynced ? 'Synced to cloud' : 'Saved locally — will sync when online'}
        </Text>
      </View>

      {/* QR placeholder */}
      <Text style={styles.qrPlaceholder}>{data.ticketId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.xl,
    padding: S.lg, backgroundColor: C.white,
  },
  brand: {
    fontSize: T.xl, fontWeight: T.black, color: C.textPrimary,
    textAlign: 'center', letterSpacing: 2, marginBottom: 2,
  },
  ticketId: {
    fontSize: T.sm, color: C.textSecondary, textAlign: 'center',
    letterSpacing: 1, fontFamily: 'monospace', marginBottom: S.sm,
  },
  dashed: {
    height: 1, borderWidth: 1, borderStyle: 'dashed',
    borderColor: C.border, marginVertical: S.md,
  },
  divider: { height: 1, backgroundColor: C.border, marginVertical: S.md },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 4,
  },
  infoLabel: {
    fontSize: T.xs, fontWeight: T.semibold, color: C.textSecondary,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  infoValue: { fontSize: T.md, fontWeight: T.bold, color: C.textPrimary },
  weightGrid: { flexDirection: 'row' },
  weightCell: { flex: 1, alignItems: 'center', paddingVertical: S.sm },
  weightCellBorder: { borderRightWidth: 1, borderRightColor: C.border },
  weightLabel: { fontSize: T.xs, fontWeight: T.semibold, color: C.textSecondary, letterSpacing: 0.5, marginBottom: 4 },
  weightValue: { fontSize: T.md, fontWeight: T.bold, color: C.textPrimary },
  gradeRow: { alignItems: 'center', paddingVertical: S.xs },
  gradePill: {
    backgroundColor: C.black, borderRadius: R.sm,
    paddingHorizontal: S.base, paddingVertical: 6,
  },
  gradeText: { fontSize: T.base, fontWeight: T.bold, color: C.white, letterSpacing: 0.5 },
  totalLabel: {
    fontSize: T.xs, fontWeight: T.semibold, color: C.textSecondary,
    textAlign: 'center', letterSpacing: 1, marginTop: S.sm, marginBottom: 4,
  },
  totalValue: {
    fontSize: T['6xl'], fontWeight: T.black, color: C.textPrimary,
    textAlign: 'center', marginBottom: S.sm,
  },
  syncRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  syncDot: { width: 7, height: 7, borderRadius: 4 },
  syncText: { fontSize: T.xs, color: C.textMuted },
  qrPlaceholder: {
    fontSize: T.xs, fontFamily: 'monospace', color: C.textMuted,
    textAlign: 'center', marginTop: S.md, letterSpacing: 1,
  },
});
