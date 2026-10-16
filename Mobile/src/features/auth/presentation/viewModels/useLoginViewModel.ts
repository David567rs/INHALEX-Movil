import { useEffect, useRef, useState } from 'react';
import { LoginError } from '../../domain/errors/LoginError';
import type { AuthSession } from '../../domain/session/AuthSession';
import {
  createEmptyLoginForm,
  validateLogin,
  type LoginErrors,
  type LoginField,
} from '../../domain/validation/loginValidation';

export const loginFieldOrder: readonly LoginField[] = ['email', 'password'];

/** Coordinates form state with the injected domain action; no HTTP or token access. */
export function useLoginViewModel(signIn: AuthSession['signIn']) {
  const [form, setForm] = useState(createEmptyLoginForm);
  const [touched, setTouched] = useState<Partial<Record<LoginField, boolean>>>({});
  const [hasValidated, setHasValidated] = useState(false);
  const [serverErrors, setServerErrors] = useState<LoginErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
      request.current = null;
    };
  }, []);
  const allErrors = validateLogin(form);
  const errors: LoginErrors = { ...serverErrors };

  for (const field of loginFieldOrder) {
    if ((hasValidated || touched[field]) && allErrors[field]) errors[field] = allErrors[field];
  }

  function updateField(field: LoginField, value: string) {
    if (request.current) return;
    setForm((current) => ({ ...current, [field]: value }));
    setServerErrors((current) => ({ ...current, [field]: undefined }));
    setMessage(null);
  }

  function touchField(field: LoginField) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function submit(): Promise<LoginField | undefined> {
    // Synchronous guard also blocks two taps before loading has rendered.
    if (request.current) return;
    const firstInvalidField = loginFieldOrder.find((field) => allErrors[field]);
    setHasValidated(true);
    setServerErrors({});
    if (firstInvalidField) {
      setMessage('Revisa los campos señalados.');
      return firstInvalidField;
    }

    const controller = new AbortController();
    request.current = controller;
    setMessage(null);
    setIsSubmitting(true);
    try {
      await signIn(form, { signal: controller.signal });
      if (!mounted.current || request.current !== controller) return;
      setForm(createEmptyLoginForm());
      setTouched({});
      setHasValidated(false);
    } catch (error) {
      if (!mounted.current || request.current !== controller) return;
      // Do not keep a rejected password in the form or render backend internals.
      setForm((current) => ({ ...current, password: '' }));
      setTouched({});
      setHasValidated(false);
      if (error instanceof LoginError) {
        if (error.kind === 'cancelled') return;
        setMessage(error.message);
        setServerErrors(error.fieldErrors ?? {});
        return loginFieldOrder.find((field) => error.fieldErrors?.[field]);
      }
      setMessage('No pudimos iniciar sesión. Inténtalo de nuevo más tarde.');
    } finally {
      if (mounted.current && request.current === controller) {
        request.current = null;
        setIsSubmitting(false);
      }
    }
  }

  return { form, errors, message, isSubmitting, updateField, touchField, submit };
}
