import { NoticesError } from '../errors/NoticesError';
import type { NoticesActions, NoticesRepository, NoticesRequestOptions } from '../repositories/NoticesRepository';

export type { NoticesActions } from '../repositories/NoticesRepository';

export function normalizeNoticeId(value: unknown): string {
  if (typeof value !== 'string' || value.length !== 24 || !/^[a-f\d]{24}$/i.test(value)) {
    throw new NoticesError('El aviso no es válido. Actualiza tu bandeja y vuelve a seleccionarlo.', 'invalid-request');
  }
  return value.toLowerCase();
}

function cancelled(): NoticesError {
  return new NoticesError('Se canceló la consulta de avisos.', 'cancelled');
}

export function createNoticesActions(repository: NoticesRepository): NoticesActions {
  async function perform<T>(operation: () => Promise<T>, options?: NoticesRequestOptions): Promise<T> {
    if (options?.signal?.aborted) throw cancelled();
    try {
      const result = await operation();
      if (options?.signal?.aborted) throw cancelled();
      return result;
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      if (error instanceof NoticesError) throw error;
      throw new NoticesError('No pudimos completar la operación de avisos. Inténtalo de nuevo.', 'unknown');
    }
  }

  return {
    list: (options) => perform(() => repository.list(options), options),
    markRead: (id, options) => perform(() => repository.markRead(normalizeNoticeId(id), options), options),
  };
}
