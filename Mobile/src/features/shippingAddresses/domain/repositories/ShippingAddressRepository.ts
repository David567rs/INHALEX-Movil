import type { ShippingAddress, ShippingAddressDraft } from '../models/ShippingAddress';

export interface ShippingAddressRequestOptions {
  signal?: AbortSignal;
}

export interface ShippingAddressRepository {
  list(options?: ShippingAddressRequestOptions): Promise<readonly ShippingAddress[]>;
  create(draft: ShippingAddressDraft, options?: ShippingAddressRequestOptions): Promise<readonly ShippingAddress[]>;
  update(id: string, draft: ShippingAddressDraft, options?: ShippingAddressRequestOptions): Promise<readonly ShippingAddress[]>;
  select(id: string, options?: ShippingAddressRequestOptions): Promise<readonly ShippingAddress[]>;
  remove(id: string, options?: ShippingAddressRequestOptions): Promise<readonly ShippingAddress[]>;
}

export interface ShippingAddressActions {
  list(options?: ShippingAddressRequestOptions): Promise<readonly ShippingAddress[]>;
  create(draft: ShippingAddressDraft, options?: ShippingAddressRequestOptions): Promise<readonly ShippingAddress[]>;
  update(id: string, draft: ShippingAddressDraft, options?: ShippingAddressRequestOptions): Promise<readonly ShippingAddress[]>;
  select(id: string, options?: ShippingAddressRequestOptions): Promise<readonly ShippingAddress[]>;
  remove(id: string, options?: ShippingAddressRequestOptions): Promise<readonly ShippingAddress[]>;
}
