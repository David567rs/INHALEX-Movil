import { mapCatalogProduct } from '../../../catalog/data/mappers/mapCatalogPage';
import type { CatalogProduct } from '../../../catalog/domain/models/Catalog';
import { ProductDetailError } from '../../domain/errors/ProductDetailError';
import type { ProductDetail } from '../../domain/models/ProductDetail';

function invalidResponse(): ProductDetailError {
  return new ProductDetailError('No pudimos mostrar este producto en este momento. Inténtalo de nuevo más tarde.', 'invalid-response');
}

function optionalText(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw invalidResponse();
  return value.trim() || null;
}

function optionalBenefits(value: unknown): readonly string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || !value.every((benefit) => typeof benefit === 'string')) throw invalidResponse();
  return value.map((benefit) => benefit.trim()).filter(Boolean);
}

export function mapProductDetail(payload: unknown, requestedId: string, now = Date.now()): ProductDetail {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) throw invalidResponse();
  const dto = payload as Record<string, unknown>;
  if (typeof dto._id !== 'string' || !/^[a-fA-F0-9]{24}$/.test(dto._id)) throw invalidResponse();
  if (/^[a-fA-F0-9]{24}$/.test(requestedId)) {
    if (dto._id.toLowerCase() !== requestedId.toLowerCase()) throw invalidResponse();
  } else if (typeof dto.slug !== 'string' || dto.slug !== requestedId.toLowerCase()) {
    throw invalidResponse();
  }

  let base: CatalogProduct;
  try { base = mapCatalogProduct(dto, now); }
  catch { throw invalidResponse(); }
  return {
    id: base.id,
    name: base.name,
    description: base.description,
    aromas: base.aromas,
    price: base.price,
    currency: base.currency,
    image: base.image,
    inStock: base.inStock,
    originalPrice: base.originalPrice,
    longDescription: optionalText(dto.longDescription),
    benefits: optionalBenefits(dto.benefits),
    presentation: optionalText(dto.presentation),
    origin: optionalText(dto.origin),
  };
}
