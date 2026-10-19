import type { ShippingAddressDraft, ShippingAddressField, ShippingAddressFieldErrors } from '../models/ShippingAddress';

export const MAX_SHIPPING_ADDRESSES = 5;
export const SHIPPING_ADDRESS_FIELDS: readonly ShippingAddressField[] = Object.freeze([
  'label', 'recipientName', 'phone', 'street', 'exteriorNumber', 'interiorNumber',
  'neighborhood', 'municipality', 'state', 'postalCode', 'references',
]);

const bounds: Readonly<Record<ShippingAddressField, readonly [number, number]>> = {
  label: [2, 40], recipientName: [2, 120], phone: [10, 15], street: [2, 120],
  exteriorNumber: [1, 20], interiorNumber: [0, 20], neighborhood: [2, 100],
  municipality: [2, 100], state: [2, 100], postalCode: [5, 5], references: [0, 300],
};

export type ShippingAddressValidation = { valid: true; values: ShippingAddressDraft }
  | { valid: false; errors: ShippingAddressFieldErrors };

export function isShippingAddressId(value: unknown): value is string {
  return typeof value === 'string' && value.length === 24 && /^[a-f\d]{24}$/i.test(value);
}

/** Address text is trimmed; internal spaces and punctuation retain their meaning. */
export function validateShippingAddressDraft(draft: ShippingAddressDraft): ShippingAddressValidation {
  const source = draft !== null && typeof draft === 'object' && !Array.isArray(draft)
    ? draft as unknown as Record<string, unknown> : {};
  const text = (field: ShippingAddressField) => typeof source[field] === 'string' ? source[field].trim() : '';
  const values: ShippingAddressDraft = {
    label: text('label'), recipientName: text('recipientName'), phone: text('phone'), street: text('street'),
    exteriorNumber: text('exteriorNumber'), interiorNumber: text('interiorNumber'), neighborhood: text('neighborhood'),
    municipality: text('municipality'), state: text('state'), postalCode: text('postalCode'), references: text('references'),
    isDefault: source.isDefault === true,
  };
  const errors: ShippingAddressFieldErrors = {};
  for (const field of SHIPPING_ADDRESS_FIELDS) {
    const optional = field === 'interiorNumber' || field === 'references';
    if (optional && source[field] === undefined) continue;
    if (typeof source[field] !== 'string') {
      errors[field] = 'Escribe este dato con texto.';
      continue;
    }
    const value = values[field];
    const [min, max] = bounds[field];
    if (value.length < min || value.length > max) {
      errors[field] = !value && min > 0 ? 'Este dato es obligatorio.'
        : min === max ? `Escribe exactamente ${min} caracteres.`
          : min === 0 ? `Usa como máximo ${max} caracteres.` : `Usa entre ${min} y ${max} caracteres.`;
    }
    if (field === 'phone' && !/^[0-9]{10,15}$/.test(value)) {
      errors.phone = 'Ingresa entre 10 y 15 dígitos, sin espacios, signos ni guiones.';
    }
    if (field === 'postalCode' && !/^[0-9]{5}$/.test(value)) {
      errors.postalCode = 'Ingresa un código postal de 5 dígitos.';
    }
  }
  if (Object.keys(errors).length > 0 || (source.isDefault !== undefined && typeof source.isDefault !== 'boolean')) {
    return { valid: false, errors };
  }
  return { valid: true, values };
}
