export type ShippingAddressDraft = Readonly<{
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string;
  neighborhood: string;
  municipality: string;
  state: string;
  postalCode: string;
  references: string;
  isDefault: boolean;
}>;

export type ShippingAddress = ShippingAddressDraft & Readonly<{ id: string }>;
export type ShippingAddressField = Exclude<keyof ShippingAddressDraft, 'isDefault'>;
export type ShippingAddressFieldErrors = Partial<Record<ShippingAddressField, string>>;
