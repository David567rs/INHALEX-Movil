import type { LoginUser } from '../models/Login';
import type { LoginOptions } from '../repositories/LoginRepository';
import type { LoginForm } from '../validation/loginValidation';

/** Public session state exposes no credential to presentation consumers. */
export interface AuthSession {
  signIn(form: LoginForm, options?: LoginOptions): Promise<LoginUser>;
  signOut(): Promise<void>;
  getSnapshot(): LoginUser | null;
  subscribe(listener: () => void): () => void;
}
