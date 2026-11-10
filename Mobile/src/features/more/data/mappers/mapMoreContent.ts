import type { MoreContent, MoreDocument } from '../../domain/models/MoreContent';
import { MORE_CONTENT_REVISION, MORE_CONTENT_SCHEMA_VERSION } from '../content/moreContentVersion';

type RecordValue = Record<string, unknown>;
function invalid(): never { throw new Error('La información recibida no tiene un formato válido.'); }
function record(value: unknown): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  return value as RecordValue;
}
function text(value: unknown, maximum = 6_000): string {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) return invalid();
  return value.trim();
}
function list<T>(value: unknown, map: (item: unknown) => T, maximum = 80): readonly T[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > maximum) return invalid();
  return Object.freeze(value.map(map));
}
function pair(value: unknown) {
  const item = record(value);
  return Object.freeze({ title: text(item.title, 240), body: text(item.body) });
}
function revision(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}\.[1-9]\d{0,5}$/.test(value)) return invalid();
  const date = value.slice(0, 10);
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return invalid();
  return value;
}
export function compareMoreRevision(left: string, right: string): number {
  const dates = left.slice(0, 10).localeCompare(right.slice(0, 10));
  return dates || Number(left.split('.')[1]) - Number(right.split('.')[1]);
}

function document(value: unknown): MoreDocument {
  const item = record(value);
  if (item.id !== 'privacidad' && item.id !== 'terminos') return invalid();
  return Object.freeze({
    id: item.id, title: text(item.title, 240), updatedAt: text(item.updatedAt, 120),
    statusLabel: text(item.statusLabel, 120),
    sections: list(item.sections, (value) => {
      const section = record(value);
      return Object.freeze({ title: text(section.title, 240), paragraphs: list(section.paragraphs, (entry) => text(entry), 40) });
    }, 60),
  });
}

/** Allowlist the mobile v1 contract. The unrelated legacy web shape is intentionally rejected. */
export function mapMoreContent(payload: unknown): { readonly content: MoreContent; readonly revision: string } {
  const envelope = record(payload);
  if (envelope.schemaVersion !== MORE_CONTENT_SCHEMA_VERSION) return invalid();
  const contentRevision = revision(envelope.revision);
  if (compareMoreRevision(contentRevision, MORE_CONTENT_REVISION) < 0) return invalid();
  const source = record(envelope.content);
  const contact = record(source.contact);
  const email = text(contact.email, 254);
  const phone = text(contact.phone, 40);
  const phoneUri = text(contact.phoneUri, 30);
  if (!/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email)
    || !/^tel:\+[1-9]\d{7,14}$/.test(phoneUri)
    || phone.replace(/[^\d+]/g, '') !== phoneUri.slice(4)) return invalid();
  const company = record(source.company);
  const innovation = record(company.innovation);
  const faqs = list(source.faqs, (value) => {
    const faq = record(value);
    const id = text(faq.id, 80);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) return invalid();
    return Object.freeze({ id, question: text(faq.question, 240), answer: text(faq.answer) });
  });
  if (new Set(faqs.map((faq) => faq.id)).size !== faqs.length) return invalid();
  const documents = list(source.documents, document, 2);
  if (documents.length !== 2 || new Set(documents.map((entry) => entry.id)).size !== 2) return invalid();
  const content: MoreContent = Object.freeze({
    contact: Object.freeze({ email, phone, phoneUri, address: text(contact.address, 1_000) }),
    company: Object.freeze({
      name: text(company.name, 240), description: text(company.description), activity: text(company.activity),
      mission: text(company.mission), vision: text(company.vision),
      innovation: Object.freeze({ description: text(innovation.description), benefits: list(innovation.benefits, pair, 20) }),
      values: list(company.values, pair, 20),
    }), faqs, documents,
  });
  return Object.freeze({ content, revision: contentRevision });
}
