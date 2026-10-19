import { useLocalSearchParams } from 'expo-router';
import { createProductDetailPreviewAction } from '@/bootstrap/createProductDetailPreviewAction';
import { ProductDetailScreen } from '@/features/productDetail/presentation/screens/ProductDetailScreen';

const readProduct = createProductDetailPreviewAction();

export default function ProductDetailRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  return <ProductDetailScreen key={typeof id === 'string' ? id : 'invalid'}
    productId={typeof id === 'string' ? id : ''} readProduct={readProduct} />;
}
