import { forwardRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { colors } from '@/core/theme/colors';

export interface FormFieldProps extends TextInputProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  error?: string;
}

export const FormField = forwardRef<TextInput, FormFieldProps>(function FormField({
  label,
  icon,
  isPassword = false,
  error,
  secureTextEntry,
  autoCapitalize,
  autoCorrect,
  spellCheck,
  onBlur,
  onFocus,
  placeholderTextColor,
  selectionColor,
  style,
  ...inputProps
}, ref) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isDisabled = inputProps.editable === false || inputProps.readOnly === true;

  return (
    <View style={styles.group}>
      <Text style={[styles.label, !!error && styles.errorLabel]}>{label}</Text>
      <View style={[
        styles.inputContainer,
        isPassword && styles.passwordContainer,
        isFocused && styles.inputContainerFocused,
        !!error && styles.inputContainerError,
      ]}>
        <Ionicons
          accessible={false}
          color={isFocused ? colors.primary : '#8A978D'}
          name={icon}
          size={19}
        />
        <TextInput
          {...inputProps}
          ref={ref}
          accessibilityLabel={inputProps.accessibilityLabel ?? label}
          accessibilityHint={error ?? inputProps.accessibilityHint}
          autoCapitalize={isPassword ? 'none' : autoCapitalize}
          autoCorrect={isPassword ? false : autoCorrect}
          spellCheck={isPassword ? false : spellCheck}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={placeholderTextColor ?? colors.textMuted}
          secureTextEntry={isPassword ? !isPasswordVisible : secureTextEntry}
          selectionColor={selectionColor ?? colors.primary}
          style={[styles.input, Platform.OS === 'web' && styles.webInput, style]}
          underlineColorAndroid="transparent"
        />
        {isPassword ? (
          <Pressable
            accessibilityLabel={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            accessibilityHint={`Cambia la visibilidad del campo ${label.toLowerCase()}.`}
            accessibilityRole="button"
            accessibilityState={{ disabled: isDisabled }}
            disabled={isDisabled}
            onPress={() => setIsPasswordVisible((visible) => !visible)}
            style={({ pressed }) => [styles.passwordToggle, pressed && styles.pressed]}
          >
            <Ionicons
              accessible={false}
              color={colors.textMuted}
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={21}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  group: { marginBottom: 20 },
  label: { color: '#68766C', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputContainer: {
    alignItems: 'center',
    backgroundColor: '#F5F8F3',
    borderColor: '#E1E9E0',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: 16,
  },
  passwordContainer: { paddingRight: 6 },
  inputContainerFocused: { backgroundColor: '#F9FBF7', borderColor: colors.primary },
  inputContainerError: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
  errorLabel: { color: colors.danger },
  errorText: { color: colors.danger, fontSize: 12, lineHeight: 18, marginTop: 6 },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    minHeight: 44,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 15,
  },
  passwordToggle: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
  pressed: { opacity: 0.65 },
  webInput: { outlineStyle: 'solid', outlineWidth: 0 },
});
