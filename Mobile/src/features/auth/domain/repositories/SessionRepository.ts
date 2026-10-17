import type { LoginUser } from '../models/Login';
import type { LoginOptions } from './LoginRepository';

export interface SessionRepository {
  verify(token: string, options?: LoginOptions): Promise<LoginUser>;
}
