import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Badge from '@/components/shared/Badge';
import type { BadgeVariant } from '@/components/shared/Badge';
import type { GateEntryRow } from '@/types';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

interface GateEntryItemProps {
  entry: GateEntryRow;
  vehicleId?: string;
  companyName?: string;
  eta?: string;
  onPress?: () => void;
}

type QcStatus = GateEntryRow['qc_status'];

function getStatusBadge(qcStatus: QcStatus): { label: string; variant: BadgeVariant } {
  switch (qcStatus) {
    case 'accepted':
      return { label: 'PASSED', variant: 'success' };
    case 'rejected':
      return { label: 'REJECTED', variant: 'error' };
    case 'partial_rejection':
      return { label: 'PARTIAL', variant: 'warning' };
    case 'pending':
      return { label: 'PENDING QC', variant: 'warning' };
    default:
      return { label: 'EXPECTED', variant: 'outline' };
  }
}

function getIcon(qcStatus: QcStatus): React.ReactNode {
  switch (qcStatus) {
    case 'accepted':
      return <Ionicons name="checkmark-circle" size={22} color={C.green} />;
    case 'rejected':
      return <Ionicons name="close-circle" size={22} color={C.red} />;
    case 'pending':
      return <Ionicons name="time-outline" size={22} color={C.amber} />;
    default:
      return <Ionicons name="car-outline" size={22} color={C.textPrimary} />;
  }
}

export default function GateEntryItem({
  entry, vehicleId, companyName, eta, onPress,
}: GateEntryItemProps) {
  const { label, variant } = getStatusBadge(entry.qc_status);
  const weight = entry.gate_net_weight_kg ?? 0;
  const variancePct = entry.variance_percent;
  const time = entry.check_in_timestamp
    ? new Date(entry.check_in_timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : eta;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85} disabled={!onPress}>
      <View style={styles.iconBox}>{getIcon(entry.qc_status)}</View>
      <View style={styles.infoBlock}>
        <Text style={styles.vehicleId} numberOfLines={1}>
          {vehicleId ?? entry.id.slice(0, 8).toUpperCase()}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[
            weight > 0 ? `${weight.toFixed(1)} kg` : null,
            variancePct != null ? `${variancePct > 0 ? '+' : ''}${variancePct.toFixed(1)}%` : null,
            time,
            companyName,
          ].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Badge label={label} variant={variant} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.white, borderRadius: R.md, borderWidth: 1, borderColor: C.border,
    padding: S.md, flexDirection: 'row', alignItems: 'center', marginBottom: S.sm,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: R.sm,
    backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: S.md,
  },
  infoBlock: { flex: 1, marginRight: S.sm },
  vehicleId: { fontSize: T.lg, fontWeight: T.bold, color: C.textPrimary, marginBottom: 2 },
  meta: { fontSize: T.base, color: C.textSecondary },
});
