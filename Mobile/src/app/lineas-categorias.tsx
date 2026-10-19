import { useState } from 'react';
import { createProductLinesAction } from '@/bootstrap/createProductLinesAction';
import { ProductLinesScreen } from '@/features/productLines/presentation/screens/ProductLinesScreen';

export default function ProductLinesRoute() {
  const [listLines] = useState(() => createProductLinesAction());
  return <ProductLinesScreen listLines={listLines} />;
}
