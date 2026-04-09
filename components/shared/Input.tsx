import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardTypeOptions,
} from 'react-native';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
  required?: boolean;
  leftIcon?: string;   // emoji
  rightIcon?: string;  // emoji
  onRightIconPress?: () => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  hint,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  disabled = false,
  required = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  autoCapitalize = 'sentences',
}) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const borderColor = error
    ? '#EF4444'
    : focused
    ? '#2D6A4F'
    : '#E5E7EB';

  const inputHeight = multiline && numberOfLines > 1 ? numberOfLines * 22 + 20 : undefined;

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}> *</Text>}
        </View>
      )}

      <View
        style={[
          styles.inputWrapper,
          { borderColor },
          focused && styles.focused,
          disabled && styles.disabledWrapper,
        ]}
      >
        {leftIcon && (
          <Text style={styles.leftIcon} accessible={false}>
            {leftIcon}
          </Text>
        )}

        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            leftIcon && styles.inputWithLeft,
            rightIcon && styles.inputWithRight,
            multiline && { height: inputHeight, textAlignVertical: 'top' },
            disabled && styles.inputDisabled,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          editable={!disabled}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.rightIconTouch}
            accessibilityRole={onRightIconPress ? 'button' : 'none'}
          >
            <Text style={styles.rightIcon}>{rightIcon}</Text>
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  required: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  focused: {
    // borderColor handled inline
  },
  disabledWrapper: {
    backgroundColor: '#F3F4F6',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#1A1A1A',
  },
  inputWithLeft: {
    paddingLeft: 6,
  },
  inputWithRight: {
    paddingRight: 6,
  },
  inputDisabled: {
    color: '#6B7280',
  },
  leftIcon: {
    fontSize: 18,
    paddingLeft: 12,
    paddingRight: 4,
  },
  rightIconTouch: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIcon: {
    fontSize: 18,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 5,
    marginLeft: 2,
  },
  hintText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5,
    marginLeft: 2,
  },
});
