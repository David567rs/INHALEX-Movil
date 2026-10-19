import type { Profile, ProfileDraft } from '../models/Profile';

export interface ProfileRequestOptions {
  signal?: AbortSignal;
}

export interface ProfileRepository {
  get(options?: ProfileRequestOptions): Promise<Profile>;
  update(draft: ProfileDraft, options?: ProfileRequestOptions): Promise<Profile>;
}

export interface ProfileActions {
  get(options?: ProfileRequestOptions): Promise<Profile>;
  update(draft: ProfileDraft, options?: ProfileRequestOptions): Promise<Profile>;
}
