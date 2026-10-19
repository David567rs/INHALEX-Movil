import { useState } from 'react';
import { createProductSearchAction } from '@/bootstrap/createProductSearchAction';
import { ProductSearchScreen } from '@/features/productSearch/presentation/screens/ProductSearchScreen';

export default function ProductSearchRoute() {
  const [searchProducts] = useState(() => createProductSearchAction());
  return <ProductSearchScreen searchProducts={searchProducts} />;
}
