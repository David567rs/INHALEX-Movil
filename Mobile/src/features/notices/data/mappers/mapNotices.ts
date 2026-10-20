import { NoticesError } from '../../domain/errors/NoticesError';
import type { Notice, NoticeInbox, NoticeSeverity, NoticeType } from '../../domain/models/Notice';

export function invalidNoticesResponse(): NoticesError {
  return new NoticesError('No pudimos confirmar los datos de tus avisos. Actualiza la bandeja e inténtalo de nuevo.', 'invalid-response');
}

const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const id = (value: unknown): value is string => typeof value === 'string' && value.length === 24 && /^[a-f\d]{24}$/i.test(value);
function text(value: unknown, maximum: number, multiline = false): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maximum && value === value.trim()
    && ![...value].some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 && !(multiline && (code === 10 || code === 13)) || code >= 127 && code <= 159;
    });
}

function optionalDate(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || value.length !== 24 || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    throw invalidNoticesResponse();
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) throw invalidNoticesResponse();
  return value;
}

export function mapNotice(payload: unknown): Notice {
  if (!record(payload) || !id(payload.id) || !text(payload.title, 120) || !text(payload.message, 500, true)
    || !['order', 'review', 'promotion', 'system', 'report'].includes(payload.type as string)
    || !['info', 'success', 'warning'].includes(payload.severity as string)) throw invalidNoticesResponse();
  return Object.freeze({ id: payload.id.toLowerCase(), title: payload.title, message: payload.message,
    type: payload.type as NoticeType, severity: payload.severity as NoticeSeverity,
    createdAt: optionalDate(payload.createdAt), readAt: optionalDate(payload.readAt) });
}

export function mapNoticeInbox(payload: unknown): NoticeInbox {
  if (!record(payload) || !Array.isArray(payload.items) || payload.items.length > 12
    || !Number.isSafeInteger(payload.unread) || (payload.unread as number) < 0) throw invalidNoticesResponse();
  const items = payload.items.map(mapNotice);
  if (new Set(items.map((item) => item.id)).size !== items.length) throw invalidNoticesResponse();
  items.sort((left, right) => {
    if (left.createdAt !== right.createdAt) {
      if (left.createdAt === null) return 1;
      if (right.createdAt === null) return -1;
      return left.createdAt < right.createdAt ? 1 : -1;
    }
    return left.id < right.id ? 1 : left.id > right.id ? -1 : 0;
  });
  // The API reads items and unread concurrently; their values need not form an atomic snapshot.
  return Object.freeze({ items: Object.freeze(items), unread: payload.unread as number });
}

export function mapReadNotice(payload: unknown, expectedId: string): Notice {
  const notice = mapNotice(payload);
  if (notice.id !== expectedId || notice.readAt === null) throw invalidNoticesResponse();
  return notice;
}
