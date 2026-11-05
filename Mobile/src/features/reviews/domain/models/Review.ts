export type ProductReview = Readonly<{
  id: string;
  userName: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  orderId: string;
  orderReference: string;
  rating: number;
  comment: string;
  status: 'published' | 'hidden';
  createdAt: string | null;
}>;

export type ReviewableProduct = Readonly<{
  orderId: string;
  orderReference: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  presentation: string;
  purchasedAt: string | null;
  review: ProductReview | null;
}>;

/** Products from the most recent thirty completed orders, deduplicated by the API. */
export type ReviewCollection = Readonly<{
  pending: readonly ReviewableProduct[];
  completed: readonly ReviewableProduct[];
}>;

export type ReviewInput = Readonly<{
  productId: string;
  orderId: string;
  rating: number;
  comment: string;
}>;

export type ReviewFieldErrors = Readonly<{ rating?: string; comment?: string }>;
