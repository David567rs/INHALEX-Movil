import type { RegisteredUser, RegistrationInput } from '../models/Registration';

export type RegistrationOptions = { signal?: AbortSignal };

export interface RegistrationRepository {
  register(input: RegistrationInput, options?: RegistrationOptions): Promise<RegisteredUser>;
}
