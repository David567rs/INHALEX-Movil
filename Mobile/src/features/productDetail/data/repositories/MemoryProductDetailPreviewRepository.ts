import type { ProductDetailPreview } from '../../domain/models/ProductDetailPreview';
import type { ProductDetailPreviewRepository } from '../../domain/repositories/ProductDetailPreviewRepository';

const MAX_PREVIEWS = 12;

/** Bounded process memory only; no persistence, fallback product or HTTP lookup. */
export class MemoryProductDetailPreviewRepository implements ProductDetailPreviewRepository {
  private readonly products = new Map<string, ProductDetailPreview>();

  remember(product: ProductDetailPreview): void {
    const snapshot: ProductDetailPreview = Object.freeze({
      id: product.id,
      name: product.name,
      description: product.description,
      aromas: Object.freeze([...product.aromas]),
      price: product.price,
      currency: product.currency,
      image: product.image,
      inStock: product.inStock,
      originalPrice: product.originalPrice,
    });
    this.products.delete(snapshot.id);
    this.products.set(snapshot.id, snapshot);
    if (this.products.size > MAX_PREVIEWS) {
      const oldestId = this.products.keys().next().value;
      if (oldestId !== undefined) this.products.delete(oldestId);
    }
  }

  get(id: string): ProductDetailPreview | null {
    return this.products.get(id) ?? null;
  }
}
