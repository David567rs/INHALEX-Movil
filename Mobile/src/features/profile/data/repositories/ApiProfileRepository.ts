import { ApiError } from '../../../../core/network/ApiError';
import type { HttpClient, HttpRequestOptions } from '../../../../core/network/HttpClient';
import { ProfileError } from '../../domain/errors/ProfileError';
import type { Profile, ProfileDraft } from '../../domain/models/Profile';
import type { ProfileRepository, ProfileRequestOptions } from '../../domain/repositories/ProfileRepository';
import { validateProfileDraft } from '../../domain/validation/profileValidation';
import { invalidProfileResponse, mapProfile } from '../mappers/mapProfile';

function cancelled(): ProfileError {
  return new ProfileError('Se canceló la operación del perfil.', 'cancelled');
}

function mapProfileError(error: unknown): ProfileError {
  if (error instanceof ProfileError) return error;
  if (error instanceof ApiError) {
    if (error.kind === 'cancelled') return cancelled();
    if (error.kind === 'timeout') {
      return new ProfileError('El perfil tardó demasiado en responder. Actualiza tus datos antes de intentarlo otra vez.', 'timeout');
    }
    if (error.kind === 'network') {
      return new ProfileError('No pudimos conectar con INHALEX. Revisa tu conexión y actualiza tu perfil.', 'network');
    }
    if (error.kind === 'invalid-response') return invalidProfileResponse();
    if (error.kind === 'invalid-request') {
      return new ProfileError('El perfil no está disponible en este momento. Inténtalo más tarde.', 'configuration');
    }
    if (error.status === 401) {
      return new ProfileError('Tu sesión ya no es válida. Inicia sesión de nuevo para consultar tu perfil.', 'unauthorized');
    }
    if (error.status === 400 || error.status === 422) {
      return new ProfileError('No pudimos aceptar los datos. Revisa nombres, apellidos y teléfono.', 'validation');
    }
    if (error.status === 403 || error.status === 429 || (error.status !== null && error.status >= 500)) {
      return new ProfileError('El servicio de perfil no está disponible por el momento. Inténtalo de nuevo más tarde.', 'server');
    }
  }
  return new ProfileError('No pudimos completar la operación del perfil. Inténtalo de nuevo más tarde.', 'unknown');
}

export class ApiProfileRepository implements ProfileRepository {
  constructor(private readonly httpClient: HttpClient) {}

  get(options?: ProfileRequestOptions): Promise<Profile> {
    return this.request({ method: 'GET' }, options);
  }

  async update(draft: ProfileDraft, options?: ProfileRequestOptions): Promise<Profile> {
    if (options?.signal?.aborted) throw cancelled();
    const validation = validateProfileDraft(draft);
    if (!validation.valid) {
      throw new ProfileError('Revisa los campos señalados antes de guardar.', 'validation', validation.errors);
    }
    const values = validation.values;
    const profile = await this.request({ method: 'PATCH', body: {
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
    } }, options);
    if (options?.signal?.aborted) throw cancelled();
    if (profile.firstName !== values.firstName || profile.lastName !== values.lastName || profile.phone !== values.phone) {
      throw invalidProfileResponse();
    }
    return profile;
  }

  private async request(requestOptions: HttpRequestOptions, options?: ProfileRequestOptions): Promise<Profile> {
    if (options?.signal?.aborted) throw cancelled();
    try {
      const payload = await this.httpClient.request('/auth/me', {
        ...requestOptions, authenticated: true, signal: options?.signal,
      });
      if (options?.signal?.aborted) throw cancelled();
      return mapProfile(payload);
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      throw mapProfileError(error);
    }
  }
}
