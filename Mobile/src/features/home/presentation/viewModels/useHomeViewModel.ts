import { useEffect, useState, useSyncExternalStore } from 'react';
import type { ListCatalog } from '@/features/catalog/domain/useCases/listCatalog';
import type { ListProductLines } from '@/features/productLines/domain/useCases/listProductLines';
import { createHomeController } from '../state/createHomeController';

export function useHomeViewModel(listCatalog: ListCatalog, listProductLines: ListProductLines) {
  const [controller] = useState(() => createHomeController(listCatalog, listProductLines));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  useEffect(() => { void controller.start(); return controller.stop; }, [controller]);

  return {
    ...state,
    setSearchQuery: controller.setSearchQuery,
    submitSearch: controller.submitSearch,
    selectCategory: controller.selectCategory,
    resetFilters: controller.resetFilters,
    refresh: controller.refresh,
    retry: controller.retry,
  };
}
