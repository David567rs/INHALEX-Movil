import type { LoginInput, LoginSession } from '../models/Login';

export type LoginOptions = { signal?: AbortSignal };

export interface LoginRepository {
  login(input: LoginInput, options?: LoginOptions): Promise<LoginSession>;
}
