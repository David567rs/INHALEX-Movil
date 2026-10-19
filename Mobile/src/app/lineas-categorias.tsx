import { useState } from 'react';
import { createProductLinesPreviewAction } from '@/bootstrap/createProductLinesPreviewAction';
import { ProductLinesScreen } from '@/features/productLines/presentation/screens/ProductLinesScreen';

export default function ProductLinesRoute() {
  const [listLines] = useState(() => createProductLinesPreviewAction());
  return <ProductLinesScreen listLines={listLines} />;
}
