type PublicAccount = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  displayName?: string;
};

const nonemptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/** Older accounts have `name` without split names/phone. Missing profile data is not an invalid identity. */
export function mapPublicAccount(payload: unknown): PublicAccount | null {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const value = payload as Record<string, unknown>;
  if (typeof value._id !== 'string' || value._id.length !== 24 || !/^[a-f\d]{24}$/i.test(value._id)
    || !nonemptyString(value.email)) return null;

  const fields = ['firstName', 'lastName', 'phone'] as const;
  if (fields.some((field) => value[field] !== undefined && !nonemptyString(value[field]))) return null;
  const incomplete = fields.some((field) => value[field] === undefined);
  if (incomplete && !nonemptyString(value.name)) return null;

  return {
    id: value._id.toLowerCase(),
    firstName: (value.firstName as string | undefined) ?? '',
    lastName: (value.lastName as string | undefined) ?? '',
    email: value.email,
    phone: (value.phone as string | undefined) ?? '',
    // Keep the original full name for display only; never guess editable names or contact data.
    ...(incomplete ? { displayName: (value.name as string).trim() } : {}),
  };
}
