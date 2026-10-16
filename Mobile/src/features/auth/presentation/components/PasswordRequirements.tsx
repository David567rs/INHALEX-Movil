import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import type { getPasswordChecks } from '../../domain/validation/registrationValidation';

const requirements = [
  ['length', '8 caracteres o más'],
  ['uppercase', 'Una mayúscula'],
  ['number', 'Un número'],
  ['symbol', 'Un símbolo'],
] as const;

export function PasswordRequirements({ checks, hasValue }: {
  checks: ReturnType<typeof getPasswordChecks>;
  hasValue: boolean;
}) {
  return (
    <View style={styles.list}>
      {requirements.map(([key, label]) => {
        const met = hasValue && checks[key];
        return (
          <View key={key} accessible accessibilityLabel={`${label}: ${met ? 'cumplido' : 'pendiente'}`} style={styles.item}>
            <Ionicons accessible={false} name={met ? 'checkmark-circle' : 'ellipse-outline'} color={met ? colors.success : colors.textMuted} size={15} />
            <Text style={[styles.label, met && styles.met]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 8, marginBottom: 20, marginTop: -7 },
  item: { alignItems: 'flex-start', flexDirection: 'row', flexBasis: '46%', flexGrow: 1, gap: 6 },
  label: { color: colors.textMuted, flex: 1, fontSize: 12, lineHeight: 17 },
  met: { color: colors.success },
});
