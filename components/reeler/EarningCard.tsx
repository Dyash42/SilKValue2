import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Design system colors
const BLACK = '#111111';
const WHITE = '#FFFFFF';
const TEXT_MUTED_ON_BLACK = 'rgba(255,255,255,0.65)';

interface EarningCardProps {
  totalEarnings: number;
  thisMonth: number;
  pending: number;
}

export default function EarningCard({ totalEarnings, thisMonth, pending }: EarningCardProps) {
  const fmt = (n: number) =>
    '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <View style={styles.card}>
      <Text style={styles.topLabel}>TOTAL EARNINGS</Text>
      <Text style={styles.amount}>{fmt(totalEarnings)}</Text>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.bottomItem}>
          <Text style={styles.bottomLabel}>This Month</Text>
          <Text style={styles.bottomValue}>{fmt(thisMonth)}</Text>
        </View>
        <View style={styles.vertDivider} />
        <View style={styles.bottomItem}>
          <Text style={styles.bottomLabel}>Pending</Text>
          <Text style={styles.bottomValue}>{fmt(pending)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BLACK,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  topLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_MUTED_ON_BLACK,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    color: WHITE,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 14,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomItem: {
    flex: 1,
  },
  vertDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  bottomLabel: {
    fontSize: 11,
    color: TEXT_MUTED_ON_BLACK,
    marginBottom: 4,
  },
  bottomValue: {
    fontSize: 15,
    fontWeight: '700',
    color: WHITE,
  },
});
