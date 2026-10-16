import type { LoginUser } from '../models/Login';
import type { LoginOptions } from '../repositories/LoginRepository';
import type { LoginForm } from '../validation/loginValidation';

export type AuthSessionState = Readonly<{
  status: 'checking' | 'anonymous' | 'authenticated' | 'recovery-error';
  user: LoginUser | null;
  message: string | null;
}>;

/** Shared stable state for the first render and server rendering. No I/O occurs here. */
export const AUTH_INITIAL_STATE: AuthSessionState = Object.freeze({
  status: 'checking',
  user: null,
  message: null,
});

/** Public session state exposes no credential to presentation consumers. */
export interface AuthSession {
  restore(): Promise<void>;
  signIn(form: LoginForm, options?: LoginOptions): Promise<LoginUser>;
  signOut(): Promise<void>;
  getSnapshot(): AuthSessionState;
  subscribe(listener: () => void): () => void;
}
