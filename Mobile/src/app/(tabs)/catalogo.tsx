import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { createCatalogAction } from '@/bootstrap/createCatalogAction';
import type { ListCatalog } from '@/features/catalog/domain/useCases/listCatalog';
import { CatalogScreen } from '@/features/catalog/presentation/screens/CatalogScreen';

const listCatalog = createCatalogAction();

export default function CatalogRoute() {
  const params = useLocalSearchParams<{ category?: string | string[]; lineName?: string | string[] }>();
  const category = params.category === undefined ? undefined : typeof params.category === 'string' ? params.category : '';
  const name = typeof params.lineName === 'string' ? params.lineName.trim().slice(0, 120) : '';
  const scopedList = useMemo<ListCatalog>(() => category === undefined ? listCatalog
    : (input, options) => listCatalog({ ...input, category }, options), [category]);
  return <CatalogScreen key={category === undefined ? 'all' : `line:${category}`} listCatalog={scopedList}
    categoryName={category === undefined ? undefined : name || 'Línea seleccionada'} />;
}
