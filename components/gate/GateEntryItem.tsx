import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Badge from '@/components/shared/Badge';
import type { BadgeVariant } from '@/components/shared/Badge';
import type { GateEntryRow } from '@/types';

// Design system colors
const WHITE = '#FFFFFF';
const BORDER = '#E5E5E5';
const SURFACE_ALT = '#F5F5F5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';

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
    case 'rejected':
      return { label: 'LATE', variant: 'black' };
    case 'accepted':
      return { label: 'CHECKED IN', variant: 'grey' };
    case 'partial_rejection':
    default:
      return { label: 'EXPECTED', variant: 'outline' };
  }
}

function getIcon(qcStatus: QcStatus): React.ReactNode {
  switch (qcStatus) {
    case 'accepted':
      return <Ionicons name="checkmark" size={22} color={TEXT_PRIMARY} />;
    case 'rejected':
      return <Ionicons name="time-outline" size={22} color={TEXT_PRIMARY} />;
    default:
      return <Ionicons name="car-outline" size={22} color={TEXT_PRIMARY} />;
  }
}

export default function GateEntryItem({
  entry,
  vehicleId,
  companyName,
  eta,
  onPress,
}: GateEntryItemProps) {
  const { label, variant } = getStatusBadge(entry.qc_status);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
    >
      <View style={styles.iconBox}>
        {getIcon(entry.qc_status)}
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.vehicleId} numberOfLines={1}>
          {vehicleId ?? entry.id.slice(0, 8).toUpperCase()}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[companyName, eta ? `ETA ${eta}` : null].filter(Boolean).join(' · ')}
        </Text>
      </View>

      <Badge label={label} variant={variant} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: WHITE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: SURFACE_ALT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoBlock: {
    flex: 1,
    marginRight: 8,
  },
  vehicleId: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
});
