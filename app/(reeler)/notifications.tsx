import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth.store';
import { useSync } from '@/hooks/useSync';
import SyncStatusBar from '@/components/shared/SyncStatusBar';
import EmptyState from '@/components/shared/EmptyState';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

type NotifRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
};

function typeIcon(type: string): { name: string; color: string } {
  if (type === 'collection_receipt' || type === 'qc_alert') return { name: 'cube-outline', color: C.amberText };
  if (type === 'payment_confirmation' || type === 'payment_pending') return { name: 'wallet-outline', color: C.greenText };
  return { name: 'information-circle-outline', color: C.textMuted };
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotifRow({ item, onPress }: { item: NotifRow; onPress: () => void }) {
  const ic = typeIcon(item.type);
  return (
    <TouchableOpacity style={[styles.row, item.is_read && styles.rowRead]} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.rowIcon, { backgroundColor: item.is_read ? C.surfaceAlt : C.surfaceAlt }]}>
        <Ionicons name={ic.name as any} size={20} color={ic.color} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, item.is_read && styles.rowTitleRead]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.rowMsg} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.rowTime}>{timeAgo(item.created_at)}</Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const { user } = useAuthStore();
  const { isSyncing, pendingCount, error: syncError, triggerSync } = useSync();
  const [notifs, setNotifs] = useState<NotifRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNotifs = useCallback(async (silent = false) => {
    if (!user?.id) { setIsLoading(false); return; }
    if (!silent) setIsLoading(true);
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setNotifs((data ?? []) as NotifRow[]);
    } catch { /* ignore */ }
    finally { setIsLoading(false); setIsRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const markAllRead = useCallback(async () => {
    if (!user?.id) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, [user?.id]);

  const handleTap = useCallback((item: NotifRow) => {
    // Mark as read
    supabase.from('notifications').update({ is_read: true }).eq('id', item.id).then(() => {
      setNotifs((prev) => prev.map((n) => n.id === item.id ? { ...n, is_read: true } : n));
    });
    if (item.related_entity_type === 'collection_ticket' && item.related_entity_id) {
      router.push({ pathname: '/(reeler)/collection-detail', params: { ticketId: item.related_entity_id } });
    } else if (item.related_entity_type === 'payment' && item.related_entity_id) {
      router.push({ pathname: '/(reeler)/payment-detail', params: { paymentId: item.related_entity_id } });
    }
  }, []);

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 80 }} />}
      </View>

      <SyncStatusBar isSyncing={isSyncing} pendingCount={pendingCount} error={syncError} onSync={triggerSync} onRetry={triggerSync} />

      <FlatList
        data={notifs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotifRow item={item} onPress={() => handleTap(item)} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => { setIsRefreshing(true); fetchNotifs(true); triggerSync(); }}
            tintColor={C.black}
          />
        }
        ListEmptyComponent={
          <EmptyState icon="🔔" title="No notifications yet" subtitle="You'll be notified about collections, payments, and updates." />
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
  },
  title: { flex: 1, fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary, marginLeft: S.sm },
  markAllText: { fontSize: T.base, color: C.textSecondary, fontWeight: T.medium },

  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: S.md,
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: '#F9FAFB',
  },
  rowRead: { backgroundColor: C.white },
  rowIcon: {
    width: 40, height: 40, borderRadius: R.lg,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: T.md, fontWeight: T.bold, color: C.textPrimary, marginBottom: 2 },
  rowTitleRead: { fontWeight: T.medium, color: C.textSecondary },
  rowMsg: { fontSize: T.base, color: C.textSecondary, lineHeight: 18, marginBottom: 4 },
  rowTime: { fontSize: T.xs, color: C.textMuted },
  unreadDot: { width: 8, height: 8, borderRadius: R.full, backgroundColor: C.black, marginTop: 6 },
  listContent: { flexGrow: 1, paddingBottom: 32 },
});
