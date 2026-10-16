import { useEffect, useRef, useState } from 'react';
import { LoginError } from '../../domain/errors/LoginError';
import type { AuthSession } from '../../domain/session/AuthSession';

export function useAccountViewModel(signOut: AuthSession['signOut']) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const pending = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function logout() {
    if (pending.current) return;
    pending.current = true;
    setIsSigningOut(true);
    setMessage(null);
    try {
      await signOut();
    } catch (error) {
      if (mounted.current) setMessage(error instanceof LoginError ? error.message : 'No pudimos eliminar los datos guardados de la sesión. Inténtalo de nuevo.');
    } finally {
      pending.current = false;
      if (mounted.current) setIsSigningOut(false);
    }
  }
  return { isSigningOut, message, logout };
}
