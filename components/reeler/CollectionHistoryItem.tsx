import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Design system colors
const WHITE = '#FFFFFF';
const BORDER = '#E5E5E5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';

interface CollectionHistoryItemProps {
  date: string;
  ticketNumber: string;
  grade: string;
  weightKg: number;
  amountInr: number;
  onPress?: () => void;
}

export default function CollectionHistoryItem({
  date,
  ticketNumber,
  grade,
  weightKg,
  amountInr,
  onPress,
}: CollectionHistoryItemProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={!onPress}
    >
      <Text style={styles.date} numberOfLines={1}>{date}</Text>
      <Text style={styles.ticketNumber} numberOfLines={1}>{ticketNumber}</Text>
      <View style={styles.gradePill}>
        <Text style={styles.gradeText}>{grade}</Text>
      </View>
      <Text style={styles.weight} numberOfLines={1}>{weightKg.toFixed(2)} kg</Text>
      <Text style={styles.amount} numberOfLines={1}>
        {'\u20B9'}{amountInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 6,
  },
  date: {
    width: 56,
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  ticketNumber: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  gradePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: WHITE,
  },
  gradeText: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  weight: {
    width: 64,
    fontSize: 12,
    color: TEXT_PRIMARY,
    textAlign: 'right',
  },
  amount: {
    width: 80,
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'right',
  },
});
