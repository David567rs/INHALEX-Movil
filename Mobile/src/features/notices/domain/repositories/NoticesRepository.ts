import type { Notice, NoticeInbox } from '../models/Notice';

export interface NoticesRequestOptions {
  signal?: AbortSignal;
}

export interface NoticesRepository {
  list(options?: NoticesRequestOptions): Promise<NoticeInbox>;
  markRead(id: string, options?: NoticesRequestOptions): Promise<Notice>;
}

export type NoticesActions = NoticesRepository;
