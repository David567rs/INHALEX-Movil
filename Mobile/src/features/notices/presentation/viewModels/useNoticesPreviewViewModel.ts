import { useState } from 'react';
import type {
  NoticePreview, NoticesPreview, NoticesPreviewFilter, NoticesPreviewScene,
} from '../../domain/models/NoticePreview';
import type { LoadNoticesPreview } from '../../domain/useCases/loadNoticesPreview';

type PreviewState = Readonly<{
  scene: NoticesPreviewScene;
  filter: NoticesPreviewFilter;
  preview: NoticesPreview;
  selectedId: string | null;
}>;
const emptyItems: readonly NoticePreview[] = Object.freeze([]);
const allItems = (preview: NoticesPreview) => preview.status === 'ready' ? preview.items : emptyItems;
const visibleItems = (state: PreviewState) => allItems(state.preview)
  .filter((notice) => state.filter === 'all' || !notice.read);

export function useNoticesPreviewViewModel(action: LoadNoticesPreview) {
  const [state, setState] = useState<PreviewState>(() => ({
    scene: 'inbox', filter: 'all', preview: action('inbox'), selectedId: null,
  }));
  const items = visibleItems(state);
  const source = allItems(state.preview);

  function selectScene(scene: NoticesPreviewScene) {
    setState({ scene, filter: 'all', preview: action(scene), selectedId: null });
  }
  function setFilter(filter: NoticesPreviewFilter) {
    setState((previous) => ({ ...previous, filter, selectedId: null }));
  }
  function selectNotice(id: string) {
    setState((previous) => ({ ...previous,
      selectedId: visibleItems(previous).some((notice) => notice.id === id) ? id : null,
    }));
  }
  function closeDetail() { setState((previous) => ({ ...previous, selectedId: null })); }

  return {
    scene: state.scene,
    filter: state.filter,
    items,
    unreadCount: source.filter((notice) => !notice.read).length,
    totalCount: source.length,
    selectedNotice: items.find((notice) => notice.id === state.selectedId) ?? null,
    error: state.preview.status === 'error' ? state.preview.message : null,
    selectScene, setFilter, selectNotice, closeDetail,
  };
}
