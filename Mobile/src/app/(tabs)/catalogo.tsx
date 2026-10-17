import { createCatalogPreview } from '@/bootstrap/createCatalogPreview';
import { CatalogScreen } from '@/features/catalog/presentation/screens/CatalogScreen';

const readPreview = createCatalogPreview();

export default function CatalogRoute() {
  return <CatalogScreen readPreview={readPreview} />;
}
