import { ApiError } from '../../../../core/network/ApiError';
import type { HttpClient, HttpRequestOptions } from '../../../../core/network/HttpClient';
import { ShippingAddressError } from '../../domain/errors/ShippingAddressError';
import type { ShippingAddress, ShippingAddressDraft } from '../../domain/models/ShippingAddress';
import type { ShippingAddressRepository, ShippingAddressRequestOptions } from '../../domain/repositories/ShippingAddressRepository';
import {
  isShippingAddressId, MAX_SHIPPING_ADDRESSES, SHIPPING_ADDRESS_FIELDS, validateShippingAddressDraft,
} from '../../domain/validation/shippingAddressValidation';

function cancelled(): ShippingAddressError {
  return new ShippingAddressError('Se canceló la operación de direcciones.', 'cancelled');
}

function invalidResponse(): ShippingAddressError {
  return new ShippingAddressError('No pudimos confirmar tus direcciones. Actualiza la lista antes de intentarlo otra vez.', 'invalid-response');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseAddresses(payload: unknown): readonly ShippingAddress[] {
  if (!Array.isArray(payload) || payload.length > MAX_SHIPPING_ADDRESSES) throw invalidResponse();
  const seen = new Set<string>();
  let defaultCount = 0;
  return Object.freeze(payload.map((item) => {
    if (!isRecord(item) || !isShippingAddressId(item.id) || typeof item.isDefault !== 'boolean') throw invalidResponse();
    const validation = validateShippingAddressDraft(item as unknown as ShippingAddressDraft);
    if (!validation.valid || SHIPPING_ADDRESS_FIELDS.some((field) =>
      item[field] !== validation.values[field] && !(item[field] === undefined && validation.values[field] === ''))) {
      throw invalidResponse();
    }
    const id = item.id.toLowerCase();
    if (seen.has(id) || (item.isDefault && ++defaultCount > 1)) throw invalidResponse();
    seen.add(id);
    return Object.freeze({ id, ...validation.values });
  }));
}

function addressId(id: string): string {
  if (!isShippingAddressId(id)) {
    throw new ShippingAddressError('La dirección no es válida. Actualiza la lista e inténtalo de nuevo.', 'validation');
  }
  return id.toLowerCase();
}

function draftValues(draft: ShippingAddressDraft): ShippingAddressDraft {
  const validation = validateShippingAddressDraft(draft);
  if (!validation.valid) {
    throw new ShippingAddressError('Revisa los datos señalados antes de guardar la dirección.', 'validation', validation.errors);
  }
  return validation.values;
}

function matches(address: ShippingAddress, values: ShippingAddressDraft): boolean {
  return SHIPPING_ADDRESS_FIELDS.every((field) => address[field] === values[field]);
}

function mapAddressError(error: unknown, method?: HttpRequestOptions['method']): ShippingAddressError {
  if (error instanceof ShippingAddressError) return error;
  if (error instanceof ApiError) {
    if (error.kind === 'cancelled') return cancelled();
    if (error.kind === 'timeout') {
      return new ShippingAddressError('Direcciones tardó demasiado en responder. Actualiza la lista antes de intentarlo otra vez.', 'timeout');
    }
    if (error.kind === 'network') {
      return new ShippingAddressError('No pudimos conectar con INHALEX. Revisa tu conexión y actualiza tus direcciones.', 'network');
    }
    if (error.kind === 'invalid-response') return invalidResponse();
    if (error.kind === 'invalid-request') {
      return new ShippingAddressError('Direcciones no está disponible en este momento. Inténtalo más tarde.', 'configuration');
    }
    if (error.status === 401) {
      return new ShippingAddressError('Tu sesión ya no es válida. Inicia sesión de nuevo para consultar tus direcciones.', 'unauthorized');
    }
    if (error.status === 404) {
      return new ShippingAddressError('No encontramos esa dirección. Actualiza la lista e inténtalo de nuevo.', 'not-found');
    }
    if (method === 'POST' && error.status === 400 && error.message === 'Solo puedes guardar hasta 5 direcciones') {
      return new ShippingAddressError('Puedes guardar hasta 5 direcciones. Edita o elimina una antes de agregar otra.', 'limit');
    }
    if (error.status === 400 || error.status === 422) {
      return new ShippingAddressError('No pudimos aceptar los datos de la dirección. Revisa los campos e inténtalo de nuevo.', 'validation');
    }
    if (error.status === 403 || error.status === 429 || (error.status !== null && error.status >= 500)) {
      return new ShippingAddressError('El servicio de direcciones no está disponible por el momento. Inténtalo de nuevo más tarde.', 'server');
    }
  }
  return new ShippingAddressError('No pudimos completar la operación de direcciones. Inténtalo de nuevo más tarde.', 'unknown');
}

export class ApiShippingAddressRepository implements ShippingAddressRepository {
  constructor(private readonly httpClient: HttpClient) {}

  list(options?: ShippingAddressRequestOptions): Promise<readonly ShippingAddress[]> {
    return this.request('/addresses', { method: 'GET' }, options);
  }

  async create(draft: ShippingAddressDraft, options?: ShippingAddressRequestOptions): Promise<readonly ShippingAddress[]> {
    if (options?.signal?.aborted) throw cancelled();
    const values = draftValues(draft);
    const addresses = await this.request('/addresses', { method: 'POST', body: values }, options);
    if (options?.signal?.aborted) throw cancelled();
    if (!addresses.some((address) => matches(address, values)
      && (values.isDefault ? address.isDefault : !address.isDefault || addresses.length === 1))) throw invalidResponse();
    return addresses;
  }

  async update(id: string, draft: ShippingAddressDraft, options?: ShippingAddressRequestOptions): Promise<readonly ShippingAddress[]> {
    if (options?.signal?.aborted) throw cancelled();
    const target = addressId(id);
    const values = draftValues(draft);
    const addresses = await this.request(`/addresses/${target}`, { method: 'PATCH', body: values }, options);
    if (options?.signal?.aborted) throw cancelled();
    const address = addresses.find((item) => item.id === target);
    if (!address || !matches(address, values) || (values.isDefault && !address.isDefault)) throw invalidResponse();
    return addresses;
  }

  async select(id: string, options?: ShippingAddressRequestOptions): Promise<readonly ShippingAddress[]> {
    if (options?.signal?.aborted) throw cancelled();
    const target = addressId(id);
    const addresses = await this.request(`/addresses/${target}`, { method: 'PATCH', body: { isDefault: true } }, options);
    if (options?.signal?.aborted) throw cancelled();
    if (!addresses.some((address) => address.id === target && address.isDefault)) throw invalidResponse();
    return addresses;
  }

  async remove(id: string, options?: ShippingAddressRequestOptions): Promise<readonly ShippingAddress[]> {
    if (options?.signal?.aborted) throw cancelled();
    const target = addressId(id);
    const addresses = await this.request(`/addresses/${target}`, { method: 'DELETE' }, options);
    if (options?.signal?.aborted) throw cancelled();
    if (addresses.some((address) => address.id === target)) throw invalidResponse();
    return addresses;
  }

  private async request(path: string, requestOptions: HttpRequestOptions,
    options?: ShippingAddressRequestOptions): Promise<readonly ShippingAddress[]> {
    if (options?.signal?.aborted) throw cancelled();
    try {
      const payload = await this.httpClient.request(path, {
        ...requestOptions, authenticated: true, signal: options?.signal,
      });
      if (options?.signal?.aborted) throw cancelled();
      return parseAddresses(payload);
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      throw mapAddressError(error, requestOptions.method);
    }
  }
}
