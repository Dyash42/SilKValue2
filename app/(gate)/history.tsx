import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth.store';
import { formatDateTime } from '@/utils/format';
import type { GateEntryRow } from '@/types';

// Design system colors
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const SURFACE_ALT = '#F5F5F5';
const BORDER = '#E5E5E5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';
const TEXT_MUTED = '#999999';
const GREEN = '#22C55E';
const RED = '#EF4444';
const AMBER = '#F59E0B';

// ---------------------------------------------------------------------------
// QC Status badge
// ---------------------------------------------------------------------------

function QcBadge({ status }: { status: string }) {
  let bg = SURFACE_ALT;
  let color = TEXT_SECONDARY;

  if (status === 'accepted') { bg = '#DCFCE7'; color = '#15803D'; }
  else if (status === 'rejected') { bg = '#FEE2E2'; color = '#B91C1C'; }
  else if (status === 'pending') { bg = '#FEF3C7'; color = '#B45309'; }
  else if (status === 'override_accepted') { bg = '#DBEAFE'; color = '#1D4ED8'; }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{status.replace('_', ' ').toUpperCase()}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Entry row card
// ---------------------------------------------------------------------------

function EntryCard({ entry, onPress }: { entry: GateEntryRow; onPress: () => void }) {
  const variancePct = entry.variance_percent ?? null;
  const inTolerance = entry.within_tolerance;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Top row: vehicle id + timestamp */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons name="car-outline" size={16} color={TEXT_SECONDARY} style={{ marginRight: 6 }} />
          <Text style={styles.vehicleText}>{entry.vehicle_id.slice(0, 8).toUpperCase()}</Text>
        </View>
        <Text style={styles.timestampText}>
          {entry.created_at ? formatDateTime(entry.created_at) : '—'}
        </Text>
      </View>

      {/* Middle row: weight + variance */}
      <View style={styles.cardMid}>
        <View style={styles.weightBlock}>
          <Text style={styles.weightLabel}>GATE WEIGHT</Text>
          <Text style={styles.weightValue}>
            {entry.gate_gross_weight_kg != null
              ? `${entry.gate_gross_weight_kg.toFixed(2)} kg`
              : '—'}
          </Text>
        </View>
        <View style={styles.weightBlock}>
          <Text style={styles.weightLabel}>VARIANCE</Text>
          <Text
            style={[
              styles.weightValue,
              variancePct != null && Math.abs(variancePct) > 5
                ? { color: RED }
                : { color: TEXT_PRIMARY },
            ]}
          >
            {variancePct != null ? `${variancePct.toFixed(1)}%` : '—'}
          </Text>
        </View>
      </View>

      {/* Bottom row: QC status + tolerance indicator */}
      <View style={styles.cardFooter}>
        <QcBadge status={entry.qc_status} />
        {inTolerance != null && (
          <View style={styles.toleranceTag}>
            <Ionicons
              name={inTolerance ? 'checkmark-circle' : 'close-circle'}
              size={14}
              color={inTolerance ? GREEN : RED}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.toleranceText, { color: inTolerance ? GREEN : RED }]}>
              {inTolerance ? 'Within Tolerance' : 'Out of Tolerance'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="time-outline" size={56} color={TEXT_MUTED} />
      <Text style={styles.emptyTitle}>No entries yet</Text>
      <Text style={styles.emptySubtitle}>Gate entry history will appear here.</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function HistoryScreen() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<GateEntryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('gate_entries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchErr) throw new Error(fetchErr.message);
      setEntries((data ?? []) as GateEntryRow[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load entries.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchEntries(true);
  }, [fetchEntries]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSub}>{entries.length > 0 ? `${entries.length} entries` : ''}</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BLACK} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={TEXT_MUTED} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchEntries()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EntryCard
              entry={item}
              onPress={() => router.push(`/(gate)/qc/${item.id}`)}
            />
          )}
          contentContainerStyle={entries.length === 0 ? styles.flatListEmpty : styles.flatListContent}
          ListEmptyComponent={<EmptyState />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={BLACK}
              colors={[BLACK]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },

  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: TEXT_PRIMARY },
  headerSub: { fontSize: 13, color: TEXT_MUTED },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { fontSize: 15, color: TEXT_SECONDARY, marginTop: 12, textAlign: 'center' },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: BLACK,
  },
  retryBtnText: { fontSize: 14, fontWeight: '600', color: WHITE },

  flatListContent: { padding: 16, paddingBottom: 32 },
  flatListEmpty: { flex: 1 },

  // Card
  card: {
    backgroundColor: WHITE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  vehicleText: { fontSize: 13, fontWeight: '700', color: TEXT_PRIMARY },
  timestampText: { fontSize: 11, color: TEXT_MUTED },

  cardMid: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weightBlock: { flex: 1 },
  weightLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: TEXT_MUTED,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  weightValue: { fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },

  badge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  toleranceTag: { flexDirection: 'row', alignItems: 'center' },
  toleranceText: { fontSize: 11, fontWeight: '600' },

  // Empty state
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: TEXT_SECONDARY, textAlign: 'center' },
});
