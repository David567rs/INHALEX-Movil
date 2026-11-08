import { useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';

/** Opens a device application only after an explicit contact action. */
export function useMoreContactViewModel() {
  const [message, setMessage] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const mounted = useRef(false);
  const pending = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function openContact(url: string, kind: 'email' | 'phone') {
    if (pending.current) return;
    pending.current = true;
    setOpening(true);
    setMessage(null);
    try {
      await Linking.openURL(url);
    } catch {
      if (mounted.current) setMessage(kind === 'email'
        ? 'No pudimos abrir tu aplicación de correo. Mantén pulsado el correo para copiarlo y escribirnos desde tu aplicación.'
        : 'No pudimos abrir el teléfono. Mantén pulsado el número para copiarlo y llamar desde tu aplicación.');
    } finally {
      pending.current = false;
      if (mounted.current) setOpening(false);
    }
  }

  return { message, opening, openContact };
}
