import { useEffect, useRef, useState } from 'react';
import { RegistrationError } from '../../domain/errors/RegistrationError';
import type { RegisteredUser } from '../../domain/models/Registration';
import type { RegisterUser } from '../../domain/useCases/registerUser';
import {
  createEmptyRegistrationForm,
  getPasswordChecks,
  validateRegistration,
  type RegistrationErrors,
  type RegistrationField,
} from '../../domain/validation/registrationValidation';

export const registrationFieldOrder: readonly RegistrationField[] = [
  'firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword',
];

/** Coordinates form state with the injected domain operation. */
export function useRegisterViewModel(registerUser: RegisterUser) {
  const [form, setForm] = useState(createEmptyRegistrationForm);
  const [touched, setTouched] = useState<Partial<Record<RegistrationField, boolean>>>({});
  const [hasValidated, setHasValidated] = useState(false);
  const [serverErrors, setServerErrors] = useState<RegistrationErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(null);
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

  const allErrors = validateRegistration(form);
  const errors: RegistrationErrors = { ...serverErrors };

  for (const field of registrationFieldOrder) {
    if ((hasValidated || touched[field]) && allErrors[field]) errors[field] = allErrors[field];
  }

  function updateField(field: RegistrationField, value: string) {
    if (request.current) return;
    setForm((current) => ({ ...current, [field]: value }));
    setServerErrors((current) => ({ ...current, [field]: undefined }));
    setMessage(null);
  }

  function touchField(field: RegistrationField) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function submit(): Promise<RegistrationField | undefined> {
    // The synchronous guard also prevents two taps before React renders loading.
    if (request.current || registeredUser) return;
    const firstInvalidField = registrationFieldOrder.find((field) => allErrors[field]);
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
      const user = await registerUser(form, { signal: controller.signal });
      if (!mounted.current || request.current !== controller) return;
      setRegisteredUser(user);
      setForm(createEmptyRegistrationForm());
      setTouched({});
      setHasValidated(false);
    } catch (error) {
      if (!mounted.current || request.current !== controller) return;
      if (error instanceof RegistrationError) {
        if (error.kind === 'cancelled') return;
        setMessage(error.message);
        setServerErrors(error.fieldErrors ?? {});
        return registrationFieldOrder.find((field) => error.fieldErrors?.[field]);
      }
      setMessage('No pudimos confirmar el registro. Inténtalo de nuevo más tarde.');
    } finally {
      if (mounted.current && request.current === controller) {
        request.current = null;
        setIsSubmitting(false);
      }
    }
  }

  return {
    form, errors, message, isSubmitting, registeredUser,
    checks: getPasswordChecks(form.password),
    updateField, touchField, submit,
  };
}
