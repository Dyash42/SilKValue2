import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardTypeOptions,
  ViewStyle,
} from 'react-native';
import { DT } from '@/constants/designTokens';

const { C, T, S, R } = { C: DT.colors, T: DT.type, S: DT.space, R: DT.radius };

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

  const borderColor = error ? C.red : focused ? C.textPrimary : C.border;

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
          placeholderTextColor={C.textMuted}
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
    marginBottom: S.base,
  },
  label: {
    fontSize: T.sm,
    fontWeight: T.semibold,
    color: C.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderWidth: 1,
    borderRadius: R.sm,
    overflow: 'hidden',
  },
  disabledWrapper: {
    backgroundColor: C.surfaceAlt,
  },
  input: {
    flex: 1,
    paddingHorizontal: S.md,
    paddingVertical: S.md,
    fontSize: T.lg,
    color: C.textPrimary,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    color: C.textSecondary,
  },
  rightElement: {
    paddingRight: S.md,
  },
  errorText: {
    fontSize: T.base,
    color: C.red,
    marginTop: S.xs,
    marginLeft: 2,
  },
});
