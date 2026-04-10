import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Badge from '@/components/shared/Badge';
import type { BadgeVariant } from '@/components/shared/Badge';

// Design system colors
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const BORDER = '#E5E5E5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';
const GREEN = '#22C55E';

type StopStatus = 'pending' | 'done' | 'skipped' | 'visited';

interface StopItemProps {
  stopNumber: number;
  reelerName: string;
  location?: string;
  status: StopStatus;
  expectedQty?: number | null;
  onPress?: () => void;
  onNavigate?: () => void;
}

function getStatusBadgeVariant(status: StopStatus): BadgeVariant {
  switch (status) {
    case 'done':
    case 'visited':
      return 'grey';
    case 'pending':
      return 'black';
    case 'skipped':
      return 'grey';
    default:
      return 'grey';
  }
}

function getStatusLabel(status: StopStatus): string {
  switch (status) {
    case 'done':
    case 'visited':
      return 'DONE';
    case 'pending':
      return 'PENDING';
    case 'skipped':
      return 'SKIPPED';
  }
}

export default function StopItem({
  stopNumber,
  reelerName,
  location,
  status,
  expectedQty,
  onPress,
  onNavigate,
}: StopItemProps) {
  const isDone = status === 'done' || status === 'visited';
  const isSkipped = status === 'skipped';
  const isPending = status === 'pending';

  const cardStyle: ViewStyle[] = [
    styles.card,
    isSkipped ? styles.cardSkipped : null,
  ].filter(Boolean) as ViewStyle[];

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
    >
      <View style={styles.row}>
        {/* Stop number circle */}
        <View style={[styles.circle, isPending ? styles.circlePending : styles.circleDone]}>
          <Text style={[styles.circleText, isPending ? styles.circleTextPending : styles.circleTextDone]}>
            {stopNumber}
          </Text>
        </View>

        {/* Name + location */}
        <View style={styles.nameBlock}>
          <Text
            style={[styles.name, isSkipped ? styles.nameSkipped : null]}
            numberOfLines={1}
          >
            {reelerName}
          </Text>
          {location ? (
            <Text style={styles.location} numberOfLines={1}>{location}</Text>
          ) : null}
        </View>

        {/* Status badge */}
        <Badge label={getStatusLabel(status)} variant={getStatusBadgeVariant(status)} />
      </View>

      {/* Expected qty row */}
      {expectedQty != null ? (
        <View style={styles.qtyRow}>
          <Text style={styles.qtyLabel}>Expected Qty</Text>
          <Text style={styles.qtyValue}>{expectedQty} kg</Text>
        </View>
      ) : null}

      {/* Action row */}
      <View style={styles.actionRow}>
        {isDone ? (
          <View style={styles.actionDone}>
            <Ionicons name="checkmark-circle" size={20} color={GREEN} />
            <Text style={[styles.actionText, { color: GREEN }]}>Collected</Text>
          </View>
        ) : isSkipped ? (
          <View style={styles.actionDone}>
            <Ionicons name="ban" size={20} color="#999999" />
            <Text style={[styles.actionText, { color: '#999999' }]}>Skipped</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.actionNavigate}
            onPress={onNavigate}
            disabled={!onNavigate}
            activeOpacity={0.75}
          >
            <Ionicons name="navigate" size={14} color={BLACK} />
            <Text style={styles.actionTextNav}>Navigate</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: WHITE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 12,
  },
  cardSkipped: {
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  circlePending: {
    backgroundColor: BLACK,
  },
  circleDone: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
  },
  circleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  circleTextPending: {
    color: WHITE,
  },
  circleTextDone: {
    color: '#999999',
  },
  nameBlock: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  nameSkipped: {
    textDecorationLine: 'line-through',
    color: '#999999',
  },
  location: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  qtyLabel: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginRight: 6,
  },
  qtyValue: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionNavigate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  actionTextNav: {
    fontSize: 13,
    fontWeight: '600',
    color: BLACK,
  },
});
