/**
 * app/(supervisor)/create-route.tsx — Silk Value Platform
 *
 * Supervisor creates a collection route:
 *   Route name → Date → Collector → Vehicle (optional) → Reeler stops → Submit
 *
 * All data fetched from Supabase-direct via supervisor.service.ts.
 * WatermelonDB is NOT involved (supervisor writes go straight to the DB).
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, FlatList, Modal, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth.store';
import {
  getClusterCollectors,
  getClusterVehicles,
  getClusterReelers,
  createRoute,
  createRouteStops,
  type RouteStopInput,
} from '@/services/supervisor.service';
import type { ProfileRow, VehicleRow } from '@/types';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

// ─── Types ────────────────────────────────────────────────────────────────────

interface StopDraft extends RouteStopInput {
  _key: string; // local unique key for list rendering
}

type PickerMode = 'collector' | 'vehicle' | 'reeler' | null;

// ─── Helper ───────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Stop row component ───────────────────────────────────────────────────────

interface StopRowProps {
  stop: StopDraft;
  index: number;
  onWeightChange: (key: string, value: string) => void;
  onRemove: (key: string) => void;
}

function StopRow({ stop, index, onWeightChange, onRemove }: StopRowProps) {
  return (
    <View style={styles.stopRow}>
      <View style={styles.stopIndex}>
        <Text style={styles.stopIndexText}>{index + 1}</Text>
      </View>
      <View style={styles.stopInfo}>
        <Text style={styles.stopName} numberOfLines={1}>{stop.reelerName}</Text>
        <TextInput
          style={styles.stopWeightInput}
          value={stop.expectedWeightKg > 0 ? String(stop.expectedWeightKg) : ''}
          onChangeText={v => onWeightChange(stop._key, v)}
          placeholder="Expected kg"
          placeholderTextColor={C.textMuted}
          keyboardType="decimal-pad"
          returnKeyType="done"
        />
      </View>
      <TouchableOpacity style={styles.stopRemoveBtn} onPress={() => onRemove(stop._key)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close-circle" size={22} color={C.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Picker Modal ─────────────────────────────────────────────────────────────

interface PickerItem { id: string; label: string; sublabel?: string; }

interface PickerModalProps {
  visible: boolean;
  title: string;
  items: PickerItem[];
  selectedId: string | null;
  onSelect: (item: PickerItem) => void;
  onClose: () => void;
  loading: boolean;
}

function PickerModal({ visible, title, items, selectedId, onSelect, onClose, loading }: PickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={C.textPrimary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={C.black} style={{ marginVertical: S['3xl'] }} />
          ) : items.length === 0 ? (
            <Text style={styles.emptyText}>No items found in this cluster</Text>
          ) : (
            <FlatList
              data={items}
              keyExtractor={i => i.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, item.id === selectedId && styles.pickerItemSelected]}
                  onPress={() => onSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerItemLabel, item.id === selectedId && styles.pickerItemLabelSelected]}>
                      {item.label}
                    </Text>
                    {item.sublabel ? <Text style={styles.pickerItemSublabel}>{item.sublabel}</Text> : null}
                  </View>
                  {item.id === selectedId && (
                    <Ionicons name="checkmark" size={18} color={C.black} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              style={styles.pickerList}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function CreateRouteScreen() {
  const { profile } = useAuthStore();
  const clusterId = profile?.cluster_id ?? '';
  const supervisorId = profile?.id ?? '';

  // ── Form fields ─────────────────────────────────────────────────────────────
  const [routeName, setRouteName]       = useState('');
  const [routeDate, setRouteDate]       = useState(todayISO());
  const [collector, setCollector]       = useState<ProfileRow | null>(null);
  const [vehicle, setVehicle]           = useState<VehicleRow | null>(null);
  const [stops, setStops]               = useState<StopDraft[]>([]);

  // ── Data ────────────────────────────────────────────────────────────────────
  const [collectors, setCollectors]     = useState<ProfileRow[]>([]);
  const [vehicles, setVehicles]         = useState<VehicleRow[]>([]);
  const [reelers, setReelers]           = useState<ProfileRow[]>([]);
  const [dataLoading, setDataLoading]   = useState(true);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [pickerMode, setPickerMode]     = useState<PickerMode>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [success, setSuccess]           = useState(false);

  // ── Load cluster data once ──────────────────────────────────────────────────
  useEffect(() => {
    if (!clusterId) return;
    let cancelled = false;

    (async () => {
      try {
        const [cols, vehs, reels] = await Promise.all([
          getClusterCollectors(clusterId),
          getClusterVehicles(clusterId),
          getClusterReelers(clusterId),
        ]);
        if (!cancelled) {
          setCollectors(cols);
          setVehicles(vehs);
          setReelers(reels);
        }
      } catch (err) {
        // Non-fatal — pickers will show "no items found"
        console.warn('CreateRoute: data load error', err);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [clusterId]);

  // ── Picker helpers ──────────────────────────────────────────────────────────

  const collectorItems: PickerItem[] = collectors.map(c => ({
    id: c.id,
    label: c.full_name ?? 'Unnamed Collector',
    sublabel: c.phone ?? undefined,
  }));

  const vehicleItems: PickerItem[] = [
    { id: '__none__', label: 'No Vehicle', sublabel: 'Assign later' },
    ...vehicles.map(v => ({
      id: v.id,
      label: v.registration_number ?? v.id,
      sublabel: `${v.vehicle_type ?? 'vehicle'} · ${v.capacity_kg ?? 0} kg`,
    })),
  ];

  const reelerItems: PickerItem[] = reelers
    .filter(r => !stops.some(s => s.reelerId === r.id))
    .map(r => ({
      id: r.id,
      label: r.full_name ?? 'Unnamed Reeler',
      sublabel: r.phone ?? undefined,
    }));

  const handlePickerSelect = useCallback((item: PickerItem) => {
    if (pickerMode === 'collector') {
      const found = collectors.find(c => c.id === item.id);
      setCollector(found ?? null);
    } else if (pickerMode === 'vehicle') {
      if (item.id === '__none__') {
        setVehicle(null);
      } else {
        const found = vehicles.find(v => v.id === item.id);
        setVehicle(found ?? null);
      }
    } else if (pickerMode === 'reeler') {
      const found = reelers.find(r => r.id === item.id);
      if (!found) return;
      const newStop: StopDraft = {
        _key: `${found.id}_${Date.now()}`,
        reelerId: found.id,
        reelerName: found.full_name ?? 'Unnamed Reeler',
        expectedWeightKg: 0,
      };
      setStops(prev => [...prev, newStop]);
    }
    setPickerMode(null);
  }, [pickerMode, collectors, vehicles, reelers]);

  const handleWeightChange = useCallback((key: string, value: string) => {
    const numeric = parseFloat(value.replace(/[^0-9.]/g, ''));
    setStops(prev => prev.map(s => s._key === key
      ? { ...s, expectedWeightKg: isNaN(numeric) ? 0 : numeric }
      : s,
    ));
  }, []);

  const handleRemoveStop = useCallback((key: string) => {
    setStops(prev => prev.filter(s => s._key !== key));
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────

  const validate = (): string | null => {
    if (!routeName.trim())    return 'Route name is required';
    if (!routeDate.match(/^\d{4}-\d{2}-\d{2}$/)) return 'Date must be YYYY-MM-DD';
    if (!collector)            return 'Select a collector';
    if (stops.length === 0)    return 'Add at least one reeler stop';
    for (const s of stops) {
      if (s.expectedWeightKg <= 0) return `Enter expected weight for ${s.reelerName}`;
    }
    return null;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setSubmitError(err); return; }
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const route = await createRoute({
        name:        routeName.trim(),
        date:        routeDate,
        clusterId,
        collectorId: collector!.id,
        vehicleId:   vehicle?.id ?? null,
        supervisorId,
        stops,
      });

      await createRouteStops(route.id, stops);

      // Reset form
      setRouteName('');
      setRouteDate(todayISO());
      setCollector(null);
      setVehicle(null);
      setStops([]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Failed to create route — check connection');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const submitDisabled = isSubmitting || dataLoading;

  if (dataLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={C.black} />
          <Text style={styles.loadingText}>Loading cluster data…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Route</Text>
        <Text style={styles.headerSub}>Assign a collection run to a collector</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Route Name ── */}
        <Text style={styles.label}>ROUTE NAME</Text>
        <TextInput
          style={styles.input}
          value={routeName}
          onChangeText={setRouteName}
          placeholder="e.g. North Cluster AM Run"
          placeholderTextColor={C.textMuted}
          editable={!isSubmitting}
          returnKeyType="next"
          autoCapitalize="words"
        />

        {/* ── Date ── */}
        <Text style={styles.label}>DATE (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={routeDate}
          onChangeText={t => setRouteDate(t.replace(/[^0-9-]/g, '').slice(0, 10))}
          placeholder={todayISO()}
          placeholderTextColor={C.textMuted}
          keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'}
          editable={!isSubmitting}
          maxLength={10}
        />

        {/* ── Collector ── */}
        <Text style={styles.label}>COLLECTOR</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setPickerMode('collector')}
          disabled={isSubmitting}
          activeOpacity={0.7}
        >
          {collector ? (
            <View style={{ flex: 1 }}>
              <Text style={styles.selectorValue}>{collector.full_name}</Text>
              {collector.phone ? <Text style={styles.selectorSub}>{collector.phone}</Text> : null}
            </View>
          ) : (
            <Text style={styles.selectorPlaceholder}>Tap to select collector</Text>
          )}
          <Ionicons name="chevron-down" size={18} color={C.textMuted} />
        </TouchableOpacity>

        {/* ── Vehicle ── */}
        <Text style={styles.label}>VEHICLE <Text style={styles.optional}>(optional)</Text></Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setPickerMode('vehicle')}
          disabled={isSubmitting}
          activeOpacity={0.7}
        >
          {vehicle ? (
            <View style={{ flex: 1 }}>
              <Text style={styles.selectorValue}>{vehicle.registration_number}</Text>
              <Text style={styles.selectorSub}>{vehicle.vehicle_type} · {vehicle.capacity_kg} kg</Text>
            </View>
          ) : (
            <Text style={styles.selectorPlaceholder}>No vehicle (assign later)</Text>
          )}
          <Ionicons name="chevron-down" size={18} color={C.textMuted} />
        </TouchableOpacity>

        {/* ── Stops ── */}
        <View style={styles.stopsHeader}>
          <Text style={[styles.label, { marginBottom: 0 }]}>REELER STOPS ({stops.length})</Text>
          <TouchableOpacity
            style={styles.addStopBtn}
            onPress={() => setPickerMode('reeler')}
            disabled={isSubmitting || reelerItems.length === 0}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={18} color={reelerItems.length === 0 ? C.textMuted : C.black} />
            <Text style={[styles.addStopText, reelerItems.length === 0 && { color: C.textMuted }]}>
              {reelerItems.length === 0 ? 'All reelers added' : 'Add Reeler'}
            </Text>
          </TouchableOpacity>
        </View>

        {stops.length === 0 ? (
          <View style={styles.emptyStops}>
            <Ionicons name="location-outline" size={28} color={C.textMuted} />
            <Text style={styles.emptyStopsText}>No stops added yet.{'\n'}Tap "Add Reeler" above.</Text>
          </View>
        ) : (
          stops.map((stop, i) => (
            <StopRow
              key={stop._key}
              stop={stop}
              index={i}
              onWeightChange={handleWeightChange}
              onRemove={handleRemoveStop}
            />
          ))
        )}

        <View style={{ height: S['3xl'] }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {success ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color={C.greenText} />
            <Text style={styles.successText}>Route created successfully!</Text>
          </View>
        ) : submitError ? (
          <Text style={styles.inlineError}>{submitError}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.submitBtn, submitDisabled && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitDisabled}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <View style={styles.submitBtnInner}>
              <ActivityIndicator size="small" color={C.white} style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Creating Route…</Text>
            </View>
          ) : (
            <Text style={styles.submitBtnText}>Create Route</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Picker modals */}
      <PickerModal
        visible={pickerMode === 'collector'}
        title="Select Collector"
        items={collectorItems}
        selectedId={collector?.id ?? null}
        onSelect={handlePickerSelect}
        onClose={() => setPickerMode(null)}
        loading={false}
      />
      <PickerModal
        visible={pickerMode === 'vehicle'}
        title="Select Vehicle"
        items={vehicleItems}
        selectedId={vehicle?.id ?? '__none__'}
        onSelect={handlePickerSelect}
        onClose={() => setPickerMode(null)}
        loading={false}
      />
      <PickerModal
        visible={pickerMode === 'reeler'}
        title="Add Reeler Stop"
        items={reelerItems}
        selectedId={null}
        onSelect={handlePickerSelect}
        onClose={() => setPickerMode(null)}
        loading={false}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: C.bg },

  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText:   { fontSize: T.md, color: C.textSecondary, marginTop: S.md },

  header: {
    paddingHorizontal: S.base, paddingTop: S.md, paddingBottom: S.lg,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: T['3xl'], fontWeight: T.bold, color: C.textPrimary },
  headerSub:   { fontSize: T.md, color: C.textSecondary, marginTop: 2 },

  scrollContent: { padding: S.base, paddingBottom: S['3xl'] },

  label: {
    fontSize: T.xs, fontWeight: T.bold, color: C.textMuted,
    letterSpacing: 0.8, marginBottom: S.sm, marginTop: S.xl,
  },
  optional: { fontWeight: T.regular, letterSpacing: 0, textTransform: 'none' },

  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingHorizontal: S.md, paddingVertical: 13,
    fontSize: T.xl, color: C.textPrimary, backgroundColor: C.surface,
  },

  selector: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    paddingHorizontal: S.md, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface,
  },
  selectorValue:       { fontSize: T.xl, color: C.textPrimary, fontWeight: T.semibold },
  selectorSub:         { fontSize: T.base, color: C.textSecondary, marginTop: 2 },
  selectorPlaceholder: { flex: 1, fontSize: T.xl, color: C.textMuted },

  stopsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: S.xl, marginBottom: S.sm,
  },
  addStopBtn: { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  addStopText: { fontSize: T.md, fontWeight: T.semibold, color: C.black },

  emptyStops: {
    borderWidth: 1, borderColor: C.border, borderStyle: 'dashed',
    borderRadius: R.lg, padding: S.xl,
    alignItems: 'center', backgroundColor: C.surfaceAlt,
  },
  emptyStopsText: {
    fontSize: T.md, color: C.textMuted, marginTop: S.sm,
    textAlign: 'center', lineHeight: 20,
  },

  stopRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, borderRadius: R.lg,
    padding: S.sm, marginBottom: S.sm, backgroundColor: C.surface,
  },
  stopIndex: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', marginRight: S.sm,
  },
  stopIndexText:   { fontSize: T.md, fontWeight: T.bold, color: C.textSecondary },
  stopInfo:        { flex: 1 },
  stopName:        { fontSize: T.md, fontWeight: T.semibold, color: C.textPrimary, marginBottom: 4 },
  stopWeightInput: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.md,
    paddingHorizontal: S.sm, paddingVertical: 6,
    fontSize: T.md, color: C.textPrimary, backgroundColor: C.surfaceAlt,
    width: 130,
  },
  stopRemoveBtn: { paddingLeft: S.sm },

  // ── Picker modal ──────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '70%', paddingBottom: S['3xl'],
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalTitle:   { fontSize: T['2xl'], fontWeight: T.bold, color: C.textPrimary },
  pickerList:   { flexGrow: 0 },
  pickerItem:   { paddingHorizontal: S.base, paddingVertical: S.md, flexDirection: 'row', alignItems: 'center' },
  pickerItemSelected:      { backgroundColor: C.surfaceAlt },
  pickerItemLabel:         { fontSize: T.xl, color: C.textPrimary },
  pickerItemLabelSelected: { fontWeight: T.bold },
  pickerItemSublabel:      { fontSize: T.base, color: C.textSecondary, marginTop: 2 },
  separator:    { height: 1, backgroundColor: C.border, marginLeft: S.base },
  emptyText:    { fontSize: T.md, color: C.textMuted, textAlign: 'center', padding: S.xl },

  // ── Footer ────────────────────────────────────────────────────────────────────
  footer: { paddingHorizontal: S.base, paddingBottom: S.md, borderTopWidth: 1, borderTopColor: C.border },
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: S.xs,
    backgroundColor: C.greenBg, borderRadius: R.md,
    paddingHorizontal: S.md, paddingVertical: S.sm,
    marginTop: S.sm,
  },
  successText:  { fontSize: T.md, color: C.greenText, fontWeight: T.semibold },
  inlineError:  { fontSize: T.base, color: C.redText, textAlign: 'center', marginTop: S.sm, marginBottom: S.xs, lineHeight: 20 },

  submitBtn: {
    backgroundColor: C.black, borderRadius: R.lg,
    paddingVertical: 16, alignItems: 'center', marginTop: S.sm,
  },
  submitBtnDisabled: { opacity: 0.35 },
  submitBtnInner:    { flexDirection: 'row', alignItems: 'center' },
  submitBtnText:     { color: C.white, fontSize: T.lg, fontWeight: T.bold },
});
