import { useEffect, useRef, useState } from 'react';
import { RegistrationError } from '../../domain/errors/RegistrationError';
import type { RegisteredUser } from '../../domain/models/Registration';
import type { RegistrationActions } from '../../domain/useCases/registerUser';
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

type VerificationStep = {
  email: string;
  challengeId: string | null;
  expiresAt: number;
  resendAt: number;
};

type RegistrationAction = 'send' | 'resend' | 'verify';
const uncertainResendErrors = new Set<RegistrationError['kind']>([
  'network', 'timeout', 'server', 'invalid-response', 'unknown',
]);

/** Keeps the registration draft and its verification challenge in screen memory. */
export function useRegisterViewModel({ requestCode, registerUser }: RegistrationActions) {
  const [form, setForm] = useState(createEmptyRegistrationForm);
  const [touched, setTouched] = useState<Partial<Record<RegistrationField, boolean>>>({});
  const [hasValidated, setHasValidated] = useState(false);
  const [serverErrors, setServerErrors] = useState<RegistrationErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<RegistrationAction | null>(null);
  const [verification, setVerification] = useState<VerificationStep | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string>();
  const [now, setNow] = useState(0);
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

  useEffect(() => {
    if (!verification) return;
    const deadline = Math.max(verification.expiresAt, verification.resendAt);
    const timer = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= deadline) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [verification]);

  const allErrors = validateRegistration(form);
  const errors: RegistrationErrors = { ...serverErrors };

  for (const field of registrationFieldOrder) {
    if ((hasValidated || touched[field]) && allErrors[field]) errors[field] = allErrors[field];
  }

  function updateField(field: RegistrationField, value: string) {
    if (request.current || verification) return;
    setForm((current) => ({ ...current, [field]: value }));
    setServerErrors((current) => ({ ...current, [field]: undefined }));
    setMessage(null);
  }

  function touchField(field: RegistrationField) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function runRequest<T>(
    action: RegistrationAction,
    execute: (signal: AbortSignal) => Promise<T>,
    apply: (result: T) => void,
  ): Promise<RegistrationError | undefined> {
    const controller = new AbortController();
    request.current = controller;
    setMessage(null);
    setPendingAction(action);
    try {
      const result = await execute(controller.signal);
      if (!mounted.current || request.current !== controller) return;
      apply(result);
    } catch (error) {
      if (!mounted.current || request.current !== controller) return;
      if (error instanceof RegistrationError && error.kind === 'cancelled') return;
      return error instanceof RegistrationError
        ? error
        : new RegistrationError('No pudimos completar la solicitud. Inténtalo de nuevo.', 'unknown');
    } finally {
      if (mounted.current && request.current === controller) {
        request.current = null;
        setPendingAction(null);
      }
    }
  }

  async function sendCode(): Promise<RegistrationField | undefined> {
    // The synchronous guard also prevents two taps before React renders loading.
    if (request.current || registeredUser) return;
    const startedAt = Date.now();
    if (verification && startedAt < verification.resendAt) return;

    const firstInvalidField = registrationFieldOrder.find((field) => allErrors[field]);
    setHasValidated(true);
    setServerErrors({});
    if (firstInvalidField) {
      setMessage('Revisa los campos señalados.');
      return firstInvalidField;
    }

    const email = verification?.email ?? form.email.trim().toLowerCase();
    const error = await runRequest(
      verification ? 'resend' : 'send',
      (signal) => requestCode(email, { signal }),
      (challenge) => {
        const receivedAt = Date.now();
        setNow(receivedAt);
        setVerification({
          email,
          challengeId: challenge.challengeId,
          expiresAt: startedAt + challenge.expiresInSeconds * 1000,
          resendAt: receivedAt + challenge.resendAfterSeconds * 1000,
        });
        setCode('');
        setCodeError(undefined);
      },
    );
    if (!error || !mounted.current) return;
    if (verification && uncertainResendErrors.has(error.kind)) {
      // The server may have replaced the previous challenge before the failure.
      setVerification({ ...verification, challengeId: null });
      setCode('');
      setCodeError(undefined);
    }
    setMessage(error.message);
    setServerErrors(error.fieldErrors ?? {});
    return registrationFieldOrder.find((field) => error.fieldErrors?.[field]);
  }

  function updateCode(value: string) {
    if (request.current || !verification?.challengeId) return;
    setCode(value.replace(/[^0-9]/g, '').slice(0, 6));
    setCodeError(undefined);
  }

  function changeEmail() {
    if (request.current) return;
    setVerification(null);
    setCode('');
    setCodeError(undefined);
    setMessage(null);
  }

  async function verifyCode() {
    if (request.current || registeredUser || !verification?.challengeId) return;
    const { email, challengeId } = verification;
    const currentTime = Date.now();
    setNow(currentTime);
    if (currentTime >= verification.expiresAt) return;
    if (!/^[0-9]{6}$/.test(code)) {
      setCodeError('Escribe el código de seis dígitos.');
      return;
    }
    setCodeError(undefined);
    const error = await runRequest(
      'verify',
      (signal) => registerUser(
        { ...form, email },
        { challengeId, code },
        { signal },
      ),
      (user) => {
        setRegisteredUser(user);
        setForm(createEmptyRegistrationForm());
        setVerification(null);
        setCode('');
      },
    );
    if (!error || !mounted.current) return;
    if (error.kind === 'invalid-code') {
      setCodeError(error.message);
      return;
    }
    setMessage(error.message);
    setServerErrors(error.fieldErrors ?? {});
  }

  return {
    form, errors, message, registeredUser, pendingAction, code, codeError,
    isSubmitting: pendingAction !== null,
    verificationEmail: verification?.email,
    needsNewCode: verification?.challengeId === null,
    isCodeExpired: verification !== null && now >= verification.expiresAt,
    resendInSeconds: verification ? Math.max(0, Math.ceil((verification.resendAt - now) / 1000)) : 0,
    checks: getPasswordChecks(form.password),
    updateField, touchField, sendCode, updateCode, changeEmail, verifyCode,
  };
}
