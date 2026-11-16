import type { AuthRequestOptions } from './AuthRequestOptions';
import type { LoginInput, LoginSession } from '../models/Login';

export type LoginOptions = AuthRequestOptions;

export interface LoginRepository {
  login(input: LoginInput, options?: LoginOptions): Promise<LoginSession>;
}
