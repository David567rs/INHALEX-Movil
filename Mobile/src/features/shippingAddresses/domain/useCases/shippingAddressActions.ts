import { ShippingAddressError } from '../errors/ShippingAddressError';
import type { ShippingAddressDraft } from '../models/ShippingAddress';
import type { ShippingAddressActions, ShippingAddressRepository, ShippingAddressRequestOptions } from '../repositories/ShippingAddressRepository';
import { isShippingAddressId, validateShippingAddressDraft } from '../validation/shippingAddressValidation';

export type { ShippingAddressActions } from '../repositories/ShippingAddressRepository';

function cancelled(): ShippingAddressError {
  return new ShippingAddressError('Se canceló la operación de direcciones.', 'cancelled');
}

function addressId(id: string): string {
  if (!isShippingAddressId(id)) {
    throw new ShippingAddressError('La dirección no es válida. Actualiza la lista e inténtalo de nuevo.', 'validation');
  }
  return id.toLowerCase();
}

function values(draft: ShippingAddressDraft): ShippingAddressDraft {
  const validation = validateShippingAddressDraft(draft);
  if (!validation.valid) {
    throw new ShippingAddressError('Revisa los datos señalados antes de guardar la dirección.', 'validation', validation.errors);
  }
  return validation.values;
}

export function createShippingAddressActions(repository: ShippingAddressRepository): ShippingAddressActions {
  async function perform<T>(operation: () => Promise<T>, options?: ShippingAddressRequestOptions): Promise<T> {
    if (options?.signal?.aborted) throw cancelled();
    try {
      const result = await operation();
      if (options?.signal?.aborted) throw cancelled();
      return result;
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      if (error instanceof ShippingAddressError) throw error;
      throw new ShippingAddressError('No pudimos completar la operación de direcciones. Inténtalo de nuevo más tarde.', 'unknown');
    }
  }

  return {
    list: (options) => perform(() => repository.list(options), options),
    create: (draft, options) => perform(() => repository.create(values(draft), options), options),
    update: (id, draft, options) => perform(() => repository.update(addressId(id), values(draft), options), options),
    select: (id, options) => perform(() => repository.select(addressId(id), options), options),
    remove: (id, options) => perform(() => repository.remove(addressId(id), options), options),
  };
}
