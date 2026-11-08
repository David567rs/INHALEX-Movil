import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef } from 'react';
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { TextInputInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';
import { Reveal } from '@/shared/components/Motion';
import { useReviewsViewModel, formatReviewDate } from '../viewModels/useReviewsViewModel';
import { reviewStyles as styles } from './reviewStyles';

const ratingDescriptions = ['Elige tu calificación', 'Muy mala', 'Mala', 'Buena', 'Muy buena', 'Excelente'];

export function ReviewsScreen() {
  const vm = useReviewsViewModel();
  const commentInput = useRef<TextInputInstance>(null);
  const selected = vm.selectedProduct;
  const backDisabled = vm.publishing || (!!selected && vm.busy);
  const gated = ['anonymous', 'recovery-error', 'session-expired'].includes(vm.status);
  function dismissKeyboard() { commentInput.current?.blur(); Keyboard.dismiss(); }
  function goBack() {
    dismissKeyboard();
    if (selected) vm.selectProduct(null);
    else if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/cuenta');
  }
  return <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel={selected ? 'Volver a mis reseñas' : 'Volver a Cuenta'}
            disabled={backDisabled} accessibilityState={{ disabled: backDisabled }} onPress={goBack}
            style={({ pressed }) => [styles.backButton, backDisabled && styles.disabled, pressed && styles.pressed]}>
            <Ionicons accessible={false} name="arrow-back" size={21} color={colors.primaryDark} />
          </Pressable>
          <Image accessibilityLabel="INHALEX, el respiro que alivia" source={require('../../../../../assets/home/brand.png')} resizeMode="contain" style={styles.brand} />
        </View>
        <Reveal>
          <Text style={styles.eyebrow}>MIS RESEÑAS</Text>
          <Text accessibilityRole="header" style={styles.title}>{selected ? 'Escribir una reseña' : 'Tu experiencia cuenta.'}</Text>
          <Text style={styles.introduction}>Comparte tu opinión sobre los productos de tus pedidos completados.</Text>
        </Reveal>

        {vm.status === 'checking' ? <Loading label="Comprobando tu sesión…" /> : gated ? <View style={styles.stateCard}>
          <Ionicons accessible={false} name="person-circle-outline" size={38} color={colors.primary} />
          <Text accessibilityRole="header" style={styles.sectionTitle}>Tus experiencias, en un solo lugar</Text>
          <Text accessibilityLiveRegion="polite" style={styles.sectionHint}>{vm.error || 'Inicia sesión para consultar los productos que puedes reseñar.'}</Text>
          {vm.status === 'recovery-error' ? <Action label="Reintentar sesión" onPress={() => void vm.restoreSession()} /> : null}
          <Action label={vm.openingSignIn ? 'Abriendo…' : 'Iniciar sesión'} disabled={vm.openingSignIn}
            onPress={() => void vm.prepareSignIn().then((ready) => { if (ready) router.push('/sign-in'); })} />
        </View> : vm.status === 'loading' ? <Loading label="Consultando tus reseñas…" /> : <>
          <Action label={vm.refreshing ? 'Actualizando…' : 'Actualizar reseñas'} secondary disabled={!vm.canRefresh}
            onPress={() => void vm.refresh()} />
          {vm.error ? <View style={styles.errorCard}>
            <Text accessibilityRole="alert" style={styles.errorText}>{vm.error}</Text>
            <Action label="Reintentar" secondary disabled={!vm.canRefresh} onPress={() => void vm.refresh()} />
          </View> : null}
          {vm.notice ? <View style={styles.successCard}>
            <Text accessibilityLiveRegion="polite" style={styles.successText}>{vm.notice}</Text>
          </View> : null}
          {vm.requiresRefresh && !selected && !vm.error ? <View style={styles.errorCard}>
            <Text accessibilityRole="alert" style={styles.errorText}>Verifica tus reseñas antes de volver a publicar. Así podremos comprobar si el envío anterior se guardó.</Text>
            <Action label="Verificar reseñas" secondary disabled={!vm.canRefresh} onPress={() => void vm.refresh()} />
          </View> : null}

          {selected ? <>
            <View style={[styles.productCard, styles.spaced]}>
              <View accessible={false} style={styles.productIcon}><Ionicons name="leaf-outline" size={25} color={colors.primaryDark} /></View>
              <View style={styles.productCopy}>
                <Text style={styles.productEyebrow}>TU PRODUCTO</Text>
                <Text accessibilityRole="header" style={styles.productName}>{selected.productName}</Text>
                {selected.presentation ? <Text style={styles.sectionHint}>{selected.presentation}</Text> : null}
                <Text style={styles.sectionHint}>Pedido {selected.orderReference}</Text>
              </View>
            </View>
            <View style={styles.formCard}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>¿Cómo fue tu experiencia?</Text>
              <Text style={styles.sectionHint}>Elige de 1 a 5 estrellas.</Text>
              <View accessibilityRole="radiogroup" accessibilityLabel="Calificación" style={styles.stars}>
                {[1, 2, 3, 4, 5].map((value) => <Pressable key={value} accessibilityRole="radio"
                  accessibilityLabel={`${value} ${value === 1 ? 'estrella' : 'estrellas'}`} accessibilityState={{ checked: vm.rating === value, disabled: vm.busy }}
                  aria-checked={vm.rating === value} disabled={vm.busy} onPress={() => vm.setRating(value)}
                  style={({ pressed }) => [styles.starButton, vm.rating === value && styles.selectedStar, pressed && styles.pressed]}>
                  <Ionicons accessible={false} name={vm.rating >= value ? 'star' : 'star-outline'} size={29} color={vm.rating >= value ? colors.primary : colors.textMuted} />
                </Pressable>)}
              </View>
              <Text accessibilityLiveRegion="polite" style={styles.ratingDescription}>{ratingDescriptions[vm.rating]}</Text>
              {vm.fieldErrors.rating ? <Text accessibilityRole="alert" style={styles.errorText}>{vm.fieldErrors.rating}</Text> : null}
              <View style={styles.commentHeading}>
                <Text accessibilityRole="header" style={styles.commentTitle}>Tu comentario</Text>
                <Text style={styles.commentHint}>¿Qué te gustó o qué mejorarías? De 4 a 700 caracteres.</Text>
              </View>
              <TextInput ref={commentInput} accessibilityLabel="Comentario de la reseña" accessibilityHint="Escribe entre 4 y 700 caracteres."
                value={vm.comment} onChangeText={vm.setComment} maxLength={700} editable={!vm.busy} multiline
                autoComplete="off" textContentType="none" importantForAutofill="no" autoCapitalize="sentences"
                submitBehavior="newline" returnKeyType="default" placeholder="¿Qué te gustó de este aroma?" placeholderTextColor={colors.textMuted}
                selectionColor={colors.primary} underlineColorAndroid="transparent" style={styles.commentInput} />
              {vm.fieldErrors.comment ? <Text accessibilityRole="alert" style={styles.errorText}>{vm.fieldErrors.comment}</Text> : null}
              <View style={styles.commentFooter}>
                <Text accessibilityLabel={`${vm.comment.length} de 700 caracteres`} style={styles.counter}>{vm.comment.length}/700</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Cerrar teclado del comentario" onPress={dismissKeyboard} style={styles.keyboardButton}>
                  <Ionicons accessible={false} name="checkmark-outline" size={16} color={colors.primaryDark} /><Text style={styles.keyboardLabel}>Cerrar teclado</Text>
                </Pressable>
              </View>
            </View>
            {vm.publishError ? <View style={styles.errorCard}><Text accessibilityRole="alert" style={styles.errorText}>{vm.publishError}</Text></View> : null}
            {vm.requiresRefresh ? <Action label="Verificar reseñas" secondary disabled={!vm.canRefresh} onPress={() => void vm.refresh()} /> : null}
            <Action label={vm.publishing ? 'Publicando…' : 'Publicar reseña'} disabled={!vm.canPublish} busy={vm.publishing}
              onPress={() => { dismissKeyboard(); void vm.publishReview(); }} />
            <Text style={styles.publishHint}>Puedes compartir una reseña por producto. Revisa tu comentario antes de publicarlo.</Text>
          </> : vm.collection ? <>
            <View style={styles.filters}>
              {([['pending', 'Por reseñar', vm.pending.length], ['completed', 'Enviadas', vm.completed.length]] as const).map(([filter, label, count]) => <Pressable
                key={filter} accessibilityRole="button" accessibilityLabel={`${label}, ${count}`} accessibilityState={{ selected: vm.filter === filter, disabled: vm.busy }}
                aria-pressed={vm.filter === filter} disabled={vm.busy} onPress={() => vm.selectFilter(filter)}
                style={[styles.filter, vm.filter === filter && styles.filterSelected, vm.busy && styles.disabled]}>
                <Text style={styles.filterLabel}>{label} · {count}</Text>
              </Pressable>)}
            </View>
            <Text style={styles.scopeNote}>Productos de tus últimos 30 pedidos completados.</Text>
            {vm.filter === 'pending' ? vm.pending.length ? vm.pending.map((item) => <Pressable key={item.productId}
              accessibilityRole="button" accessibilityLabel={`Reseñar ${item.productName}. Pedido ${item.orderReference}`}
              accessibilityState={{ disabled: !vm.canSelectProduct }} disabled={!vm.canSelectProduct} onPress={() => vm.selectProduct(item.productId)}
              style={({ pressed }) => [styles.productCard, pressed && styles.pressed, !vm.canSelectProduct && styles.disabled]}>
              <View accessible={false} style={styles.productIcon}><Ionicons name="leaf-outline" size={25} color={colors.primaryDark} /></View>
              <View style={styles.productCopy}><Text style={styles.productEyebrow}>POR RESEÑAR</Text><Text style={styles.productName}>{item.productName}</Text>
                {item.presentation ? <Text style={styles.sectionHint}>{item.presentation}</Text> : null}
                <Text style={styles.sectionHint}>Pedido {item.orderReference} · {formatReviewDate(item.purchasedAt)}</Text>
                <Text style={styles.link}>Escribir reseña →</Text>
              </View>
            </Pressable>) : <View style={styles.stateCard}>
              <Ionicons accessible={false} name="star-outline" size={38} color={colors.primary} />
              <Text accessibilityRole="header" style={styles.sectionTitle}>No tienes productos por reseñar</Text>
              <Text style={styles.sectionHint}>Aquí aparecerán los productos de tus pedidos completados que todavía no has reseñado.</Text>
              <Action label="Ver mis pedidos" secondary onPress={() => router.navigate('/historial-pedidos')} />
              <Action label="Explorar catálogo" onPress={() => router.navigate('/catalogo')} />
            </View> : vm.completed.length ? vm.completed.map((item) => <View key={item.productId} style={styles.completedCard}>
              <Text accessibilityRole="header" style={styles.productName}>{item.productName}</Text>
              <Text style={styles.statusBadge}>{item.review?.status === 'hidden' ? 'No visible públicamente' : 'Publicada'}</Text>
              <Text accessibilityLabel={`Calificación ${item.review?.rating} de 5`} style={styles.savedRating}>{'★'.repeat(item.review?.rating ?? 0)}</Text>
              <Text selectable style={styles.reviewComment}>{item.review?.comment}</Text>
              <Text style={styles.sectionHint}>{formatReviewDate(item.review?.createdAt ?? null)}</Text>
              <Text style={styles.sectionHint}>Pedido {item.review?.orderReference}</Text>
            </View>) : <View style={styles.stateCard}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>Aún no has enviado reseñas</Text>
              <Text style={styles.sectionHint}>Cuando compartas una experiencia, podrás consultarla aquí.</Text>
              <Action label="Ver productos por reseñar" secondary onPress={() => vm.selectFilter('pending')} />
            </View>}
          </> : null}
        </>}
        <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.signature}>
          <View style={styles.signatureLine} /><Image source={require('../../../../../assets/inhalex-mark.png')} resizeMode="contain" style={styles.mark} /><View style={styles.signatureLine} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function Loading({ label }: { label: string }) {
  return <View style={styles.stateCard}><ActivityIndicator size="large" color={colors.primary} /><Text accessibilityLiveRegion="polite" style={styles.sectionHint}>{label}</Text></View>;
}
function Action({ label, onPress, disabled = false, secondary = false, busy = false }: {
  label: string; onPress: () => void; disabled?: boolean; secondary?: boolean; busy?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled, busy }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.publishButton, secondary && styles.secondaryButton, disabled && styles.disabled, pressed && styles.pressed]}>
    <Text style={[styles.publishLabel, secondary && styles.secondaryLabel]}>{label}</Text>
  </Pressable>;
}
