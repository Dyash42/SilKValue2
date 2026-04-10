import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';

// Design system colors
const BG = '#FFFFFF';
const BORDER = '#E5E5E5';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padded?: boolean;
}

export default function Card({ children, style, onPress, padded = true }: CardProps) {
  const cardStyle: ViewStyle[] = [
    styles.card,
    padded ? styles.padded : null,
    style,
  ].filter(Boolean) as ViewStyle[];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BG,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  padded: {
    padding: 16,
  },
});
