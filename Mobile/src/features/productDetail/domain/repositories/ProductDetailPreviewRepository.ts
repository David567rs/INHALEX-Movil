import type { ProductDetailPreview } from '../models/ProductDetailPreview';

export interface ProductDetailPreviewRepository {
  get(id: string): ProductDetailPreview | null;
}
