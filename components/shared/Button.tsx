import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: string; // emoji icon prefix
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
}) => {
  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle[] = [
    styles.base,
    styles[`variant_${variant}`] as ViewStyle,
    styles[`size_${size}`] as ViewStyle,
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
  ].filter(Boolean) as ViewStyle[];

  const textStyle: TextStyle[] = [
    styles.text,
    styles[`text_${variant}`] as TextStyle,
    styles[`textSize_${size}`] as TextStyle,
    isDisabled && styles.textDisabled,
  ].filter(Boolean) as TextStyle[];

  const spinnerColor =
    variant === 'outline' || variant === 'ghost' ? '#2D6A4F' : '#FFFFFF';

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
        <Text style={textStyle}>
          {icon ? `${icon}  ${title}` : title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 0,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },

  // --- Variants ---
  variant_primary: {
    backgroundColor: '#2D6A4F',
  },
  variant_secondary: {
    backgroundColor: '#1A1A1A',
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#2D6A4F',
  },
  variant_danger: {
    backgroundColor: '#EF4444',
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },

  // --- Sizes ---
  size_sm: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  size_md: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
  },
  size_lg: {
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 12,
  },

  // --- Text ---
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: '#FFFFFF',
  },
  text_outline: {
    color: '#2D6A4F',
  },
  text_danger: {
    color: '#FFFFFF',
  },
  text_ghost: {
    color: '#2D6A4F',
  },
  textDisabled: {
    // opacity handled by container
  },

  textSize_sm: {
    fontSize: 13,
  },
  textSize_md: {
    fontSize: 15,
  },
  textSize_lg: {
    fontSize: 17,
  },
});
