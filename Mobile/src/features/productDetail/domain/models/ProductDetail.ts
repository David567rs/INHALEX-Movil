export type ProductDetail = Readonly<{
  id: string;
  name: string;
  description: string;
  aromas: readonly string[];
  price: number;
  currency: string;
  image: string | null;
  inStock: boolean;
  originalPrice: number | null;
  longDescription: string | null;
  benefits: readonly string[];
  presentation: string | null;
  origin: string | null;
}>;
