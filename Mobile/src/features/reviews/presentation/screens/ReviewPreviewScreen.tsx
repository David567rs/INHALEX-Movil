import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';
import { Reveal } from '@/shared/components/Motion';
import type { ReadReviewPreview } from '../../domain/useCases/readReviewPreview';
import { REVIEW_PREVIEW_COMMENT_MAX_LENGTH, useReviewPreviewViewModel } from '../viewModels/useReviewPreviewViewModel';
import { reviewStyles as styles } from './reviewStyles';

const ratingDescriptions = ['Elige tu calificación', 'Muy mala', 'Mala', 'Buena', 'Muy buena', 'Excelente'];

/** Local design preview only: no review is submitted or stored. */
export function ReviewPreviewScreen({ action }: { action: ReadReviewPreview }) {
  const { productName, rating, comment, setRating, setComment } = useReviewPreviewViewModel(action);
  const commentInput = useRef<TextInput>(null);

  function dismissKeyboard() {
    commentInput.current?.blur();
    Keyboard.dismiss();
  }

  function goBack() {
    dismissKeyboard();
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/cuenta');
  }

  return <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={goBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons accessible={false} name="arrow-back" size={21} color={colors.primaryDark} />
          </Pressable>
          <Image accessibilityLabel="INHALEX, el respiro que alivia" source={require('../../../../../assets/home/brand.png')}
            resizeMode="contain" style={styles.brand} />
        </View>

        <Reveal>
          <Text style={styles.eyebrow}>MIS RESEÑAS</Text>
          <Text accessibilityRole="header" style={styles.title}>Escribir una reseña</Text>
          <Text style={styles.introduction}>Cuéntanos qué te pareció el aroma que recibiste.</Text>
          <View style={styles.previewNotice}>
            <View style={styles.previewBadge}>
              <Ionicons accessible={false} name="eye-outline" size={14} color={colors.primaryDark} />
              <Text style={styles.previewBadgeText}>VISTA PREVIA</Text>
            </View>
            <Text style={styles.previewCopy}>Prueba el formulario con este producto de ejemplo.</Text>
          </View>
        </Reveal>

        <Reveal delay={40}>
          <View style={styles.productCard}>
            <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.productIcon}>
              <Ionicons name="leaf-outline" size={25} color={colors.primaryDark} />
            </View>
            <View style={styles.productCopy}>
              <Text style={styles.productEyebrow}>PRODUCTO</Text>
              <Text accessibilityRole="header" style={styles.productName}>{productName}</Text>
            </View>
          </View>
        </Reveal>

        <Reveal delay={70}>
          <View style={styles.formCard}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>¿Cómo fue tu experiencia?</Text>
            <Text style={styles.sectionHint}>Elige de 1 a 5 estrellas.</Text>
            <View accessibilityRole="radiogroup" accessibilityLabel="Calificación de muestra" style={styles.stars}>
              {[1, 2, 3, 4, 5].map((value) => <Pressable key={value} accessibilityRole="radio"
                accessibilityLabel={`${value} ${value === 1 ? 'estrella' : 'estrellas'}`}
                accessibilityHint="Cambia la calificación de esta vista previa."
                accessibilityState={{ checked: rating === value }} aria-checked={rating === value}
                onPress={() => setRating(value)}
                style={({ pressed }) => [styles.starButton, rating === value && styles.selectedStar, pressed && styles.pressed]}>
                <Ionicons accessible={false} name={rating >= value ? 'star' : 'star-outline'} size={29}
                  color={rating >= value ? colors.primary : colors.textMuted} />
              </Pressable>)}
            </View>
            <Text accessibilityLiveRegion="polite" style={styles.ratingDescription}>
              {ratingDescriptions[rating] || ratingDescriptions[0]}
            </Text>

            <View style={styles.commentHeading}>
              <Text accessibilityRole="header" style={styles.commentTitle}>Tu comentario</Text>
              <Text style={styles.commentHint}>¿Qué te gustó o qué mejorarías?</Text>
            </View>
            <TextInput ref={commentInput} accessibilityLabel="Comentario de muestra"
              accessibilityHint={`Hasta ${REVIEW_PREVIEW_COMMENT_MAX_LENGTH} caracteres. Este comentario de vista previa no se publica.`}
              value={comment} onChangeText={setComment} maxLength={REVIEW_PREVIEW_COMMENT_MAX_LENGTH} multiline
              autoComplete="off" textContentType="none" importantForAutofill="no"
              autoCapitalize="sentences" submitBehavior="newline" returnKeyType="default"
              placeholder="¿Qué te gustó de este aroma?" placeholderTextColor={colors.textMuted}
              selectionColor={colors.primary} underlineColorAndroid="transparent" style={styles.commentInput} />
            <View style={styles.commentFooter}>
              <Text accessibilityLabel={`${comment.length} de ${REVIEW_PREVIEW_COMMENT_MAX_LENGTH} caracteres`} style={styles.counter}>
                {comment.length}/{REVIEW_PREVIEW_COMMENT_MAX_LENGTH}
              </Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar teclado del comentario" onPress={dismissKeyboard}
                style={({ pressed }) => [styles.keyboardButton, pressed && styles.pressed]}>
                <Ionicons accessible={false} name="checkmark-outline" size={16} color={colors.primaryDark} />
                <Text style={styles.keyboardLabel}>Cerrar teclado</Text>
              </Pressable>
            </View>
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel="Publicar reseña"
            accessibilityHint="La publicación estará disponible en la siguiente etapa."
            accessibilityState={{ disabled: true }} disabled style={styles.publishButton}>
            <Ionicons accessible={false} name="paper-plane-outline" size={19} color={colors.white} />
            <Text style={styles.publishLabel}>Publicar reseña</Text>
          </Pressable>
          <View style={styles.publishNotice}>
            <Ionicons accessible={false} name="information-circle-outline" size={18} color={colors.textMuted} />
            <Text style={styles.publishHint}>En esta vista previa el comentario se descarta al salir.</Text>
          </View>
        </Reveal>

        <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.signature}>
          <View style={styles.signatureLine} />
          <Image source={require('../../../../../assets/inhalex-mark.png')} resizeMode="contain" style={styles.mark} />
          <View style={styles.signatureLine} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
