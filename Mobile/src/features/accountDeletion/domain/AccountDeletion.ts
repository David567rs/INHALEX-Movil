export type DeletionRequest = Readonly<{ id: string; status: 'pending'; createdAt: string }>;
export type DeletionInput = Readonly<{ password: string; confirmation: string }>;
export interface AccountDeletionRepository {
  get(signal?: AbortSignal): Promise<DeletionRequest | null>;
  request(input: DeletionInput, signal?: AbortSignal): Promise<DeletionRequest>;
}
export class AccountDeletionError extends Error {
  constructor(message: string, public readonly kind: 'unavailable' | 'unauthorized' | 'reauthentication' | 'validation') {
    super(message); this.name = 'AccountDeletionError';
  }
}
export function validateDeletion(input: DeletionInput): string | null {
  if (typeof input.password !== 'string' || !input.password || input.password.length > 128) return 'Escribe tu contraseña actual.';
  if (typeof input.confirmation !== 'string' || input.confirmation.trim() !== 'ELIMINAR') return 'Escribe ELIMINAR para confirmar la solicitud.';
  return null;
}
