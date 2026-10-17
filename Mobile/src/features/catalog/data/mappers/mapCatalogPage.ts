import isISO4217 from 'validator/lib/isISO4217';
import isISO8601 from 'validator/lib/isISO8601';
import { CatalogError } from '../../domain/errors/CatalogError';
import type { CatalogPage, CatalogProduct } from '../../domain/models/Catalog';
import type { CatalogListInput } from '../../domain/repositories/CatalogRepository';

function invalidResponse(): CatalogError {
  return new CatalogError('No pudimos cargar el catálogo en este momento. Inténtalo de nuevo más tarde.', 'invalid-response');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonemptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPrice(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function hasUnsafeCharacters(value: string): boolean {
  return /\s/.test(value) || [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 0x20 || (code >= 0x7f && code <= 0x9f);
  });
}

/** Frontend paths stay paths: the presentation layer resolves packaged assets without using the API origin. */
function mapImage(value: unknown): string | null {
  if (typeof value !== 'string' || !value || value.includes('\\') || hasUnsafeCharacters(value)) return null;
  let decoded: string;
  try { decoded = decodeURIComponent(value); }
  catch { return null; }
  if (hasUnsafeCharacters(decoded) || decoded.includes('\\')) return null;

  if (value.startsWith('/') && !value.startsWith('//')) {
    if (decoded.length <= 1 || decoded.startsWith('//') || /[%?#]/.test(decoded)
      || decoded.split('/').some((segment) => segment === '.' || segment === '..')) return null;
    return value;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && value.toLowerCase().startsWith('https://')
      && !url.username && !url.password ? value : null;
  } catch {
    return null;
  }
}

function promotionIsCurrent(value: unknown, now: number): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value !== 'string' || !isISO8601(value, { strict: true, strictSeparator: true })) return false;
  const end = Date.parse(value);
  return Number.isFinite(end) && end > now;
}

function mapProduct(value: unknown, now: number): CatalogProduct {
  if (!isRecord(value) || !isNonemptyString(value._id) || !isNonemptyString(value.name)
    || !isNonemptyString(value.description) || !isPrice(value.price)
    || typeof value.currency !== 'string' || !/^[A-Z]{3}$/.test(value.currency) || !isISO4217(value.currency)
    || !Array.isArray(value.aromas) || !value.aromas.every((aroma) => typeof aroma === 'string')
    || typeof value.inStock !== 'boolean') throw invalidResponse();

  const hasPromotion = value.promoActive === true && isPrice(value.promoPrice)
    && value.promoPrice > 0 && value.promoPrice < value.price && promotionIsCurrent(value.promoEndsAt, now);

  return {
    id: value._id,
    name: value.name,
    description: value.description,
    aromas: [...value.aromas] as string[],
    price: hasPromotion ? value.promoPrice as number : value.price,
    currency: value.currency,
    image: mapImage(value.image),
    inStock: value.inStock,
    originalPrice: hasPromotion ? value.price : null,
  };
}

export function mapCatalogPage(payload: unknown, expected: CatalogListInput, now = Date.now()): CatalogPage {
  if (!isRecord(payload) || !Array.isArray(payload.items)
    || !Number.isSafeInteger(payload.total) || (payload.total as number) < 0
    || payload.page !== expected.page || payload.limit !== expected.limit
    || !Number.isSafeInteger(payload.totalPages) || (payload.totalPages as number) < 1) throw invalidResponse();

  const total = payload.total as number;
  const totalPages = Math.max(1, Math.ceil(total / expected.limit));
  const expectedCount = expected.page > totalPages ? 0 : Math.min(expected.limit, total - (expected.page - 1) * expected.limit);
  if (payload.totalPages !== totalPages || payload.items.length !== expectedCount) throw invalidResponse();

  const items = payload.items.map((product) => mapProduct(product, now));
  if (new Set(items.map((product) => product.id)).size !== items.length) throw invalidResponse();
  return { items, total, page: expected.page, limit: expected.limit, totalPages };
}
