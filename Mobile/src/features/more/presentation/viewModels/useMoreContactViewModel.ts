import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Linking } from 'react-native';

type ContactField = 'email' | 'phone' | 'address';

const copiedLabels: Record<ContactField, string> = {
  email: 'Correo copiado',
  phone: 'Teléfono copiado',
  address: 'Domicilio copiado',
};

/** Device actions run only after an explicit contact action; clipboard contents are never read. */
export function useMoreContactViewModel() {
  const [message, setMessage] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copiedField, setCopiedField] = useState<ContactField | null>(null);
  const mounted = useRef(false);
  const pending = useRef(false);
  const copyPending = useRef(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  async function copyContact(value: string, field: ContactField) {
    if (copyPending.current) return;
    copyPending.current = true;
    setCopying(true);
    setCopiedField(null);
    setMessage(null);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    try {
      // Keep this write within the user's press gesture, including on the web.
      const copied = await Clipboard.setStringAsync(value);
      if (!mounted.current) return;
      if (!copied) {
        setMessage('No pudimos copiar el dato. Toca el icono de copiar para intentarlo de nuevo.');
        return;
      }
      setCopiedField(field);
      AccessibilityInfo.announceForAccessibility(copiedLabels[field]);
      feedbackTimer.current = setTimeout(() => {
        feedbackTimer.current = null;
        if (mounted.current) setCopiedField(null);
      }, 2200);
    } catch {
      if (mounted.current) setMessage('No pudimos copiar el dato. Toca el icono de copiar para intentarlo de nuevo.');
    } finally {
      copyPending.current = false;
      if (mounted.current) setCopying(false);
    }
  }

  async function openContact(url: string, kind: 'email' | 'phone') {
    if (pending.current) return;
    pending.current = true;
    setOpening(true);
    setMessage(null);
    try {
      await Linking.openURL(url);
    } catch {
      if (mounted.current) setMessage(kind === 'email'
        ? 'No pudimos abrir tu aplicación de correo. Usa el icono de copiar para llevar el correo a tu aplicación.'
        : 'No pudimos abrir el teléfono. Usa el icono de copiar para llevar el número a tu aplicación.');
    } finally {
      pending.current = false;
      if (mounted.current) setOpening(false);
    }
  }

  return { message, opening, openContact, copying, copiedField, copyContact };
}
