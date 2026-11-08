import { ApiError } from '../../../core/network/ApiError';
import type { HttpClient } from '../../../core/network/HttpClient';
import { AccountDeletionError, validateDeletion, type AccountDeletionRepository, type DeletionInput, type DeletionRequest } from '../domain/AccountDeletion';

function parse(payload: unknown, nullable: boolean): DeletionRequest | null {
  if (!payload || typeof payload !== 'object' || !('request' in payload)) throw new Error('Invalid response');
  const item = payload.request;
  if (item === null && nullable) return null;
  if (!item || typeof item !== 'object' || !('id' in item) || typeof item.id !== 'string'
    || !/^[a-f0-9]{24}$/i.test(item.id) || !('status' in item) || item.status !== 'pending'
    || !('createdAt' in item) || typeof item.createdAt !== 'string' || !Number.isFinite(Date.parse(item.createdAt))) throw new Error('Invalid response');
  return Object.freeze({ id: item.id, status: 'pending', createdAt: item.createdAt });
}
function failure(error: unknown, write: boolean): AccountDeletionError {
  if (error instanceof AccountDeletionError) return error;
  if (error instanceof ApiError && error.status === 401) return new AccountDeletionError(
    write ? 'No pudimos verificar tu contraseña o sesión. Pulsa Verificar solicitud antes de volver a intentarlo.' : 'Tu sesión ya no es válida. Inicia sesión para continuar.',
    write ? 'reauthentication' : 'unauthorized');
  if (error instanceof ApiError && error.status === 429) return new AccountDeletionError('Has realizado varios intentos. Espera un momento antes de volver a intentarlo.', 'unavailable');
  return new AccountDeletionError(write
    ? 'No pudimos confirmar la solicitud. Verifica su estado antes de volver a enviarla.'
    : 'No pudimos consultar la solicitud. Inténtalo de nuevo.', 'unavailable');
}
export class ApiAccountDeletionRepository implements AccountDeletionRepository {
  constructor(private readonly client: HttpClient) {}
  async get(signal?: AbortSignal): Promise<DeletionRequest | null> {
    try { return await this.client.request('/account-deletion/me', { authenticated: true, signal, parse: (body) => parse(body, true) }); }
    catch (error) { throw failure(error, false); }
  }
  async request(input: DeletionInput, signal?: AbortSignal): Promise<DeletionRequest> {
    const error = validateDeletion(input);
    if (error) throw new AccountDeletionError(error, 'validation');
    try {
      return await this.client.request('/account-deletion/me', { method: 'POST', authenticated: true, signal,
        body: { password: input.password, confirmation: 'ELIMINAR' }, parse: (body) => parse(body, false) as DeletionRequest });
    } catch (error) { throw failure(error, true); }
  }
}
