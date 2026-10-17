export type CatalogProduct = Readonly<{
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

export type CatalogPage = Readonly<{
  items: readonly CatalogProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>;
