import { createCatalogAction } from '@/bootstrap/createCatalogAction';
import { CatalogScreen } from '@/features/catalog/presentation/screens/CatalogScreen';

const listCatalog = createCatalogAction();

export default function CatalogRoute() {
  return <CatalogScreen listCatalog={listCatalog} />;
}
