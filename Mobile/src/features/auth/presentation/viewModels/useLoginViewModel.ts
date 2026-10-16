import { useState } from 'react';
import {
  createEmptyLoginForm,
  validateLogin,
  type LoginErrors,
  type LoginField,
} from '../../domain/validation/loginValidation';

export const loginFieldOrder: readonly LoginField[] = ['email', 'password'];

/** Coordinates local form state and pure validation; authentication is a later step. */
export function useLoginViewModel() {
  const [form, setForm] = useState(createEmptyLoginForm);
  const [touched, setTouched] = useState<Partial<Record<LoginField, boolean>>>({});
  const [hasValidated, setHasValidated] = useState(false);
  const [validationResult, setValidationResult] = useState<'valid' | 'invalid' | null>(null);
  const allErrors = validateLogin(form);
  const errors: LoginErrors = {};

  for (const field of loginFieldOrder) {
    if ((hasValidated || touched[field]) && allErrors[field]) errors[field] = allErrors[field];
  }

  function updateField(field: LoginField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationResult(null);
  }

  function touchField(field: LoginField) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function validateForm(): LoginField | undefined {
    const firstInvalidField = loginFieldOrder.find((field) => allErrors[field]);
    setHasValidated(true);
    setValidationResult(firstInvalidField ? 'invalid' : 'valid');
    return firstInvalidField;
  }

  return { form, errors, validationResult, updateField, touchField, validateForm };
}
