import { useState } from 'react';
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

/** Local form state and validation only. Creating an account is a later step. */
export function useRegisterViewModel() {
  const [form, setForm] = useState(createEmptyRegistrationForm);
  const [touched, setTouched] = useState<Partial<Record<RegistrationField, boolean>>>({});
  const [hasValidated, setHasValidated] = useState(false);
  const [validationResult, setValidationResult] = useState<'valid' | 'invalid' | null>(null);
  const allErrors = validateRegistration(form);
  const errors: RegistrationErrors = {};

  for (const field of registrationFieldOrder) {
    if ((hasValidated || touched[field]) && allErrors[field]) errors[field] = allErrors[field];
  }

  function updateField(field: RegistrationField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationResult(null);
  }

  function touchField(field: RegistrationField) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function validateForm(): RegistrationField | undefined {
    const firstInvalidField = registrationFieldOrder.find((field) => allErrors[field]);
    setHasValidated(true);
    setValidationResult(firstInvalidField ? 'invalid' : 'valid');
    return firstInvalidField;
  }

  return {
    form, errors, validationResult,
    checks: getPasswordChecks(form.password),
    updateField, touchField, validateForm,
  };
}
