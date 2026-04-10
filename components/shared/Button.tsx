import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';

// Design system colors
const BLACK = '#000000';
const WHITE = '#FFFFFF';

export type ButtonVariant = 'primary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const spinnerColor = variant === 'primary' ? WHITE : BLACK;

  const containerStyle: ViewStyle[] = [
    styles.base,
    styles[`container_${variant}`] as ViewStyle,
    styles[`size_${size}`] as ViewStyle,
    fullWidth ? styles.fullWidth : null,
    isDisabled ? styles.disabled : null,
  ].filter(Boolean) as ViewStyle[];

  const labelStyle: TextStyle[] = [
    styles.label,
    styles[`label_${variant}`] as TextStyle,
    styles[`labelSize_${size}`] as TextStyle,
  ].filter(Boolean) as TextStyle[];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <View style={styles.inner}>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <Text style={labelStyle}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 0,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.4,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    marginRight: 8,
  },

  // Containers
  container_primary: {
    backgroundColor: BLACK,
    borderWidth: 0,
  },
  container_outline: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BLACK,
  },
  container_ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },

  // Sizes
  size_sm: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  size_md: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  size_lg: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },

  // Labels
  label: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  label_primary: {
    color: WHITE,
  },
  label_outline: {
    color: BLACK,
  },
  label_ghost: {
    color: BLACK,
  },

  // Label sizes
  labelSize_sm: {
    fontSize: 13,
  },
  labelSize_md: {
    fontSize: 15,
  },
  labelSize_lg: {
    fontSize: 16,
  },
});
