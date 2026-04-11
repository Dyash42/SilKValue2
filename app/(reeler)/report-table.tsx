import React, { useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCollectionTicket } from '@/hooks/useCollectionTicket';
import EmptyState from '@/components/shared/EmptyState';
import CollectionTicketModel from '@/models/CollectionTicketModel';
import { formatCurrency, formatDate } from '@/utils/format';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

function gradeColor(grade: string) {
  if (grade === 'A+' || grade === 'A') return C.greenText;
  if (grade === 'B') return C.amberText;
  return C.redText;
}

export default function ReportTableScreen() {
  const { pendingTickets } = useCollectionTicket();

  const sorted = useMemo(
    () => [...pendingTickets].sort((a, b) => b.collectionTimestamp.getTime() - a.collectionTimestamp.getTime()),
    [pendingTickets],
  );

  const renderRow = useCallback(({ item }: { item: CollectionTicketModel }) => {
    const gc = gradeColor(item.qualityGrade);
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push({ pathname: '/(reeler)/collection-detail', params: { ticketId: item.id } })}
        activeOpacity={0.78}
      >
        <Text style={[styles.cell, { width: 72 }]} numberOfLines={1}>
          {formatDate(item.collectionTimestamp).slice(0, 11)}
        </Text>
        <Text style={[styles.cellBold, { flex: 1 }]} numberOfLines={1}>
          {item.ticketNumber}
        </Text>
        <Text style={[styles.cellGrade, { color: gc }]}>{item.qualityGrade}</Text>
        <Text style={[styles.cell, { width: 60, textAlign: 'right' }]}>
          {item.netWeightKg.toFixed(1)} kg
        </Text>
        <Text style={[styles.cellBold, { width: 80, textAlign: 'right' }]}>
          {formatCurrency(item.totalAmount)}
        </Text>
      </TouchableOpacity>
    );
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Collection Details</Text>
        <TouchableOpacity onPress={() => alert('CSV export coming soon.')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="download-outline" size={22} color={C.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Column headers */}
      <View style={styles.colHeaderRow}>
        <Text style={[styles.colHeader, { width: 72 }]}>DATE</Text>
        <Text style={[styles.colHeader, { flex: 1 }]}>TICKET</Text>
        <Text style={[styles.colHeader, { width: 36 }]}>GRD</Text>
        <Text style={[styles.colHeader, { width: 60, textAlign: 'right' }]}>WEIGHT</Text>
        <Text style={[styles.colHeader, { width: 80, textAlign: 'right' }]}>AMOUNT</Text>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
        ListEmptyComponent={
          <EmptyState
            icon="📊"
            title="No data available"
            subtitle="Collection data will appear here once you have tickets."
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.border,
    gap: S.sm,
  },
  headerTitle: { flex: 1, fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary, textAlign: 'center' },

  colHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: S.base, paddingVertical: S.sm,
    backgroundColor: C.surfaceAlt,
    borderBottomWidth: 1, borderBottomColor: C.border,
    gap: 6,
  },
  colHeader: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textSecondary,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: S.base, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: C.border,
    gap: 6,
  },
  cell: { fontSize: T.base, color: C.textSecondary },
  cellBold: { fontSize: T.base, fontWeight: T.semibold, color: C.textPrimary },
  cellGrade: { width: 36, fontSize: T.xs, fontWeight: T.bold, textAlign: 'center' },

  listContent: { flexGrow: 1, paddingBottom: 32 },
});
