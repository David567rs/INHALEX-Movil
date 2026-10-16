import { useState } from 'react';

type LoginField = 'email' | 'password';

/** Editable presentation state only; validation and sign-in belong to later steps. */
export function useLoginViewModel() {
  const [form, setForm] = useState({ email: '', password: '' });

  function updateField(field: LoginField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return { form, updateField };
}
