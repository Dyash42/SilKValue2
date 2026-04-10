import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Badge from '@/components/shared/Badge';

// Design system colors
const WHITE = '#FFFFFF';
const BORDER = '#E5E5E5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';
const TEXT_MUTED = '#999999';
const PROGRESS_FILL = '#111111';
const PROGRESS_BG = '#E5E5E5';

interface RouteCardProps {
  routeName: string;
  cluster?: string;
  totalStops: number;
  completedStops: number;
  date?: string;
  isActive?: boolean;
  onPress?: () => void;
}

export default function RouteCard({
  routeName,
  cluster,
  totalStops,
  completedStops,
  date,
  isActive = false,
  onPress,
}: RouteCardProps) {
  const progress = totalStops > 0 ? completedStops / totalStops : 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
    >
      <View style={styles.topRow}>
        <View style={styles.nameBlock}>
          <Text style={styles.routeName} numberOfLines={1}>{routeName}</Text>
          {cluster ? <Text style={styles.cluster} numberOfLines={1}>{cluster}</Text> : null}
        </View>
        <Badge label={isActive ? 'ACTIVE' : 'INACTIVE'} variant={isActive ? 'black' : 'grey'} />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.stopsText}>{completedStops}/{totalStops} stops</Text>
        {date ? <Text style={styles.dateText}>{date}</Text> : null}
      </View>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameBlock: {
    flex: 1,
    marginRight: 8,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  cluster: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stopsText: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  dateText: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: PROGRESS_BG,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: PROGRESS_FILL,
  },
});
