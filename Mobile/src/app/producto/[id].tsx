import { useLocalSearchParams } from 'expo-router';
import { createProductDetailAction } from '@/bootstrap/createProductDetailAction';
import { ProductDetailScreen } from '@/features/productDetail/presentation/screens/ProductDetailScreen';

const getProduct = createProductDetailAction();

export default function ProductDetailRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  return <ProductDetailScreen key={typeof id === 'string' ? id : 'invalid'}
    productId={typeof id === 'string' ? id : ''} getProduct={getProduct} />;
}
