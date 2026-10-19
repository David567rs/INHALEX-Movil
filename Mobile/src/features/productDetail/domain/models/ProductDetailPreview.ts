/** Public snapshot selected from the catalog; independent of transport and UI. */
export type ProductDetailPreview = Readonly<{
  id: string;
  name: string;
  description: string;
  aromas: readonly string[];
  price: number;
  currency: string;
  image: string | null;
  inStock: boolean;
  originalPrice: number | null;
}>;
