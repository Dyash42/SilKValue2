import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardTypeOptions,
  ViewStyle,
} from 'react-native';

// Design system colors
const BG = '#FFFFFF';
const SURFACE_ALT = '#F5F5F5';
const BORDER = '#E5E5E5';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#666666';
const TEXT_MUTED = '#999999';
const RED = '#EF4444';
const FOCUSED_BORDER = '#111111';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  multiline?: boolean;
  disabled?: boolean;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
  disabled = false,
  rightElement,
  style,
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error ? RED : focused ? FOCUSED_BORDER : BORDER;

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text style={styles.label}>{label.toUpperCase()}</Text>
      ) : null}
      <View
        style={[
          styles.inputWrapper,
          { borderColor },
          disabled ? styles.disabledWrapper : null,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            multiline ? styles.multiline : null,
            disabled ? styles.inputDisabled : null,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={TEXT_MUTED}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
        />
        {rightElement ? (
          <View style={styles.rightElement}>{rightElement}</View>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  disabledWrapper: {
    backgroundColor: SURFACE_ALT,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: TEXT_PRIMARY,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    color: TEXT_SECONDARY,
  },
  rightElement: {
    paddingRight: 12,
  },
  errorText: {
    fontSize: 12,
    color: RED,
    marginTop: 4,
    marginLeft: 2,
  },
});
