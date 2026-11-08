import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { AppScreen } from '@/shared/components/AppScreen';
import { Reveal, SoftPressable } from '@/shared/components/Motion';
import { ScreenState } from '@/shared/components/ScreenFeedback';
import type { MoreContent, MoreDocument, MoreSectionId } from '../../domain/models/MoreContent';
import type { LoadMoreContent } from '../../domain/useCases/loadMoreContent';
import { MoreBackButton, MoreLoadState, MoreRow } from '../components/MoreControls';
import { MoreBrandHeader } from '../components/MoreBrandHeader';
import { MoreEntrance } from '../components/MoreMotion';
import { useMoreViewModel } from '../viewModels/useMoreViewModel';
import { useMoreContactViewModel } from '../viewModels/useMoreContactViewModel';
import { MoreRefresh } from '../components/MoreRefresh';

const titles: Record<MoreSectionId, string> = {
  'preguntas-frecuentes': 'Preguntas frecuentes',
  contacto: 'Contacto',
  empresa: 'Nuestra empresa',
  privacidad: 'Política de privacidad',
  terminos: 'Términos y condiciones',
};

const sectionIcons: Record<MoreSectionId, keyof typeof Ionicons.glyphMap> = {
  'preguntas-frecuentes': 'help-circle-outline',
  contacto: 'chatbubble-ellipses-outline',
  empresa: 'leaf-outline',
  privacidad: 'shield-checkmark-outline',
  terminos: 'document-text-outline',
};

export function MoreInformationScreen({ section, loadContent }: { section: string; loadContent: LoadMoreContent }) {
  const vm = useMoreViewModel(loadContent);
  const validSection = Object.prototype.hasOwnProperty.call(titles, section) ? section as MoreSectionId : null;
  const document = vm.content?.documents.find((item) => item.id === validSection);

  return <AppScreen title={validSection ? titles[validSection] : 'Información'} eyebrow="INHALEX"
    action={<MoreBackButton />} includeBottomInset animateContent={false}>
    {!validSection ? <ScreenState title="Esta sección no está disponible"
      message="Encuentra nuestras opciones de ayuda e información en Más."
      actionLabel="Volver a Más" onAction={() => router.replace('/(tabs)/mas')} />
      : !vm.content ? <MoreLoadState isLoading={vm.isLoading} message={vm.message} onRetry={vm.reload} />
        : <MoreEntrance key={validSection}>
          <MoreBrandHeader icon={sectionIcons[validSection]} />
          <MoreRefresh loading={vm.isLoading} message={vm.message} onRefresh={vm.reload} />
          {validSection === 'privacidad' ? <MoreRow title="Eliminar cuenta" description="Consulta o envía tu solicitud" icon="person-remove-outline" onPress={() => router.push('/eliminar-cuenta')} last /> : null}
          {validSection === 'preguntas-frecuentes' ? <>
            <Text style={styles.intro}>Encuentra una respuesta antes de elegir tu próximo aroma.</Text>
            <View style={styles.faqList}>
              {vm.content.faqs.map((faq) => {
                const expanded = vm.openFaqId === faq.id;
                return <View key={faq.id} style={[styles.faq, expanded && styles.faqOpen]}>
                  <SoftPressable accessibilityRole="button" accessibilityLabel={faq.question}
                    accessibilityState={{ expanded }} onPress={() => vm.toggleFaq(faq.id)}
                    style={({ pressed }) => [styles.faqQuestion, pressed && styles.pressed]}>
                    <Text style={styles.faqTitle}>{faq.question}</Text>
                    <View accessible={false} style={[styles.faqToggle, expanded && styles.faqToggleOpen]}>
                      <Ionicons accessible={false} name={expanded ? 'remove' : 'add'} size={19} color={expanded ? colors.white : colors.primary} />
                    </View>
                  </SoftPressable>
                  {expanded ? <Reveal><Text selectable style={styles.faqAnswer}>{faq.answer}</Text></Reveal> : null}
                </View>;
              })}
            </View>
            <View style={styles.helpCard}>
              <Text accessibilityRole="header" style={styles.smallTitle}>¿Necesitas algo más?</Text>
              <Text style={styles.body}>Estamos aquí para orientarte.</Text>
              <SoftPressable accessibilityRole="button" onPress={() => router.push({ pathname: '/informacion/[section]', params: { section: 'contacto' } })}
                style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}>
                <Text style={styles.textActionLabel}>Contactar a INHALEX</Text>
                <Ionicons accessible={false} name="arrow-forward" size={19} color={colors.primaryDark} />
              </SoftPressable>
            </View>
          </> : null}

          {validSection === 'contacto' ? <ContactContent contact={vm.content.contact} /> : null}
          {validSection === 'empresa' ? <CompanyContent company={vm.content.company} /> : null}
          {validSection === 'privacidad' || validSection === 'terminos' ? document
            ? <DocumentContent document={document} />
            : <ScreenState title="Documento no disponible" message="Puedes consultar tus dudas desde Contacto."
              actionLabel="Ir a Contacto" onAction={() => router.push({ pathname: '/informacion/[section]', params: { section: 'contacto' } })} />
            : null}
        </MoreEntrance>}
  </AppScreen>;
}

function ContactContent({ contact }: { contact: MoreContent['contact'] }) {
  const { message, opening, openContact } = useMoreContactViewModel();

  return <>
    <Text style={styles.intro}>Dudas sobre un aroma, tu cuenta o un pedido. Elige cómo prefieres contactarnos.</Text>
    {message ? <View style={styles.contactNotice}>
      <Text selectable accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.contactNoticeText}>{message}</Text>
    </View> : null}
    <View style={styles.stack}>
      <View style={styles.card}>
        <SectionTitle icon="mail-outline" title="Escríbenos" />
        <Text selectable style={styles.contactValue}>{contact.email}</Text>
        <SoftPressable accessibilityRole="button" accessibilityLabel="Abrir aplicación de correo"
          accessibilityState={{ disabled: opening, busy: opening }} disabled={opening}
          onPress={() => { void openContact(`mailto:${contact.email}`, 'email'); }}
          style={({ pressed }) => [styles.action, opening && styles.disabled, pressed && styles.pressed]}>
          <Text style={styles.actionLabel}>Enviar correo</Text>
          <Ionicons accessible={false} name="arrow-up-right-box-outline" size={18} color={colors.white} />
        </SoftPressable>
      </View>
      <View style={styles.card}>
        <SectionTitle icon="call-outline" title="Por teléfono" />
        <Text selectable style={styles.contactValue}>{contact.phone}</Text>
        <SoftPressable accessibilityRole="button" accessibilityLabel="Abrir aplicación de teléfono"
          accessibilityState={{ disabled: opening, busy: opening }} disabled={opening}
          onPress={() => { void openContact(contact.phoneUri, 'phone'); }}
          style={({ pressed }) => [styles.outlineAction, opening && styles.disabled, pressed && styles.pressed]}>
          <Text style={styles.outlineActionLabel}>Abrir teléfono</Text>
          <Ionicons accessible={false} name="call-outline" size={18} color={colors.primaryDark} />
        </SoftPressable>
      </View>
      <View style={styles.card}>
        <SectionTitle icon="location-outline" title="Domicilio de contacto" />
        <Text selectable style={styles.body}>{contact.address}</Text>
      </View>
    </View>
  </>;
}

function CompanyContent({ company }: { company: MoreContent['company'] }) {
  return <>
    <View style={styles.companyLead}>
      <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.companyHalo} />
      <Text accessibilityRole="header" style={styles.companyName}>{company.name}</Text>
      <Text selectable style={styles.companyDescription}>{company.description}</Text>
    </View>
    <View style={styles.stack}>
      <View style={styles.card}>
        <SectionTitle icon="leaf-outline" title="A qué nos dedicamos" />
        <Text selectable style={styles.body}>{company.activity}</Text>
      </View>
      <View style={styles.card}>
        <SectionTitle icon="compass-outline" title="Nuestra misión" />
        <Text selectable style={styles.body}>{company.mission}</Text>
      </View>
      <View style={styles.card}>
        <SectionTitle icon="sunny-outline" title="Nuestra visión" />
        <Text selectable style={styles.body}>{company.vision}</Text>
      </View>
      <View style={[styles.card, styles.innovationCard]}>
        <SectionTitle icon="phone-portrait-outline" title="Innovación tecnológica" />
        <Text selectable style={styles.body}>{company.innovation.description}</Text>
        {company.innovation.benefits.map((benefit) => <View key={benefit.title} style={styles.value}>
          <Text accessibilityRole="header" style={styles.smallTitle}>{benefit.title}</Text>
          <Text selectable style={styles.body}>{benefit.body}</Text>
        </View>)}
      </View>
      <View style={styles.card}>
        <SectionTitle icon="sparkles-outline" title="Nuestros valores" />
        {company.values.map((value) => <View key={value.title} style={styles.value}>
          <Text accessibilityRole="header" style={styles.smallTitle}>{value.title}</Text>
          <Text selectable style={styles.body}>{value.body}</Text>
        </View>)}
      </View>
    </View>
  </>;
}

function DocumentContent({ document }: { document: MoreDocument }) {
  return <>
    <View style={styles.documentMeta}>
      <View style={styles.status}>
        <Ionicons accessible={false} name="document-text-outline" size={16} color={colors.primaryDark} />
        <Text style={styles.statusText}>{document.statusLabel}</Text>
      </View>
      <Text style={styles.date}>Actualización: {document.updatedAt}</Text>
    </View>
    <View style={styles.document}>
      {document.sections.map((section, index) => <View key={`${index}-${section.title}`} style={styles.documentSection}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>{section.title}</Text>
        {section.paragraphs.map((paragraph, paragraphIndex) => <Text key={paragraphIndex} selectable style={styles.paragraph}>{paragraph}</Text>)}
      </View>)}
    </View>
  </>;
}

function SectionTitle({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return <View style={styles.sectionHeading}>
    <View accessible={false} style={styles.sectionIcon}>
      <Ionicons accessible={false} name={icon} size={21} color={colors.primary} />
    </View>
    <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
  </View>;
}

const styles = StyleSheet.create({
  intro: { color: colors.textMuted, fontSize: 14, lineHeight: 23, marginBottom: 22 },
  stack: { gap: 14 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, padding: 20 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 15 },
  sectionIcon: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 13, height: 40, justifyContent: 'center', width: 40 },
  sectionTitle: { color: colors.text, flexShrink: 1, fontSize: 18, fontWeight: '700', lineHeight: 26 },
  smallTitle: { color: colors.text, fontSize: 16, fontWeight: '700', lineHeight: 24 },
  body: { color: colors.textMuted, fontSize: 14, lineHeight: 24 },
  faqList: { gap: 10 },
  faq: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 19, borderWidth: 1, overflow: 'hidden' },
  faqOpen: { borderColor: '#AACAAE' },
  faqToggle: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 11, height: 30, justifyContent: 'center', width: 30 },
  faqToggleOpen: { backgroundColor: colors.primaryDark },
  faqQuestion: { alignItems: 'center', flexDirection: 'row', gap: 14, minHeight: 64, padding: 18 },
  faqTitle: { color: colors.text, flex: 1, minWidth: 0, fontSize: 15, fontWeight: '600', lineHeight: 23 },
  faqAnswer: { color: colors.textMuted, fontSize: 14, lineHeight: 24, paddingBottom: 20, paddingHorizontal: 18 },
  helpCard: { backgroundColor: colors.surfaceSoft, borderRadius: 22, gap: 6, marginTop: 24, padding: 20 },
  textAction: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 9, minHeight: 48, paddingVertical: 12 },
  textActionLabel: { color: colors.primaryDark, flexShrink: 1, fontSize: 14, fontWeight: '700', lineHeight: 21 },
  contactValue: { color: colors.text, flexShrink: 1, fontSize: 15, lineHeight: 25, marginBottom: 20, maxWidth: '100%', minWidth: 0 },
  contactNotice: { backgroundColor: colors.warningSoft, borderRadius: 16, marginBottom: 16, padding: 16 },
  contactNoticeText: { color: colors.text, fontSize: 14, lineHeight: 23 },
  action: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 15, flexDirection: 'row', gap: 10, justifyContent: 'center', minHeight: 50, paddingHorizontal: 16, paddingVertical: 14 },
  actionLabel: { color: colors.white, flexShrink: 1, fontSize: 14, fontWeight: '700', lineHeight: 22 },
  outlineAction: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 15, flexDirection: 'row', gap: 10, justifyContent: 'center', minHeight: 50, paddingHorizontal: 16, paddingVertical: 14 },
  outlineActionLabel: { color: colors.primaryDark, flexShrink: 1, fontSize: 14, fontWeight: '700', lineHeight: 22 },
  companyLead: { backgroundColor: colors.primaryDark, borderColor: '#34794D', borderRadius: 24, borderWidth: 1, gap: 12, marginBottom: 20, overflow: 'hidden', padding: 22 },
  companyHalo: { borderColor: 'rgba(191,233,199,0.16)', borderRadius: 110, borderWidth: 20, height: 220, position: 'absolute', right: -100, top: -110, width: 220 },
  companyName: { color: colors.white, fontSize: 23, fontWeight: '700', letterSpacing: -0.4, lineHeight: 31 },
  companyDescription: { color: '#E0EEE2', fontSize: 14, lineHeight: 25 },
  innovationCard: { backgroundColor: '#F2F9F4', borderColor: '#CADFCE' },
  value: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, gap: 6, marginTop: 12, paddingTop: 16 },
  documentMeta: { gap: 12, marginBottom: 22 },
  status: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.surfaceSoft, borderRadius: 12, flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 9 },
  statusText: { color: colors.primaryDark, flexShrink: 1, fontSize: 12, fontWeight: '600', lineHeight: 19 },
  date: { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
  document: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, padding: 20 },
  documentSection: { gap: 11, marginBottom: 24 },
  paragraph: { color: colors.textMuted, fontSize: 14, lineHeight: 25 },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.7 },
});
