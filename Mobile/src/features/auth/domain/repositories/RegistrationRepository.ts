import type { AuthRequestOptions } from './AuthRequestOptions';
import type {
  RegisteredUser, RegistrationChallenge, RegistrationInput, RegistrationVerification,
} from '../models/Registration';

export type RegistrationOptions = AuthRequestOptions;

export interface RegistrationRepository {
  requestCode(email: string, options?: RegistrationOptions): Promise<RegistrationChallenge>;
  register(
    input: RegistrationInput,
    verification: RegistrationVerification,
    options?: RegistrationOptions,
  ): Promise<RegisteredUser>;
}
