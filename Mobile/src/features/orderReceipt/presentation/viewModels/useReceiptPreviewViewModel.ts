import { useMemo, useState } from 'react';
import type { ReceiptPreviewScene } from '../../domain/models/ReceiptPreview';
import type { ReadReceiptPreview } from '../../domain/useCases/ReadReceiptPreview';

export const receiptPreviewScenes: readonly { id: ReceiptPreviewScene; label: string }[] = [
  { id: 'pending', label: 'Pendiente' },
  { id: 'confirmed', label: 'Confirmada' },
  { id: 'issue', label: 'Con incidencia' },
  { id: 'empty', label: 'Sin pedidos' },
];

export function useReceiptPreviewViewModel(readPreview: ReadReceiptPreview) {
  const [scene, setScene] = useState<ReceiptPreviewScene>('pending');
  const [dialogOpen, setDialogOpen] = useState(false);
  const order = useMemo(() => readPreview.execute(scene), [readPreview, scene]);
  const canPreviewConfirmation = order?.receiptStatus === 'pending';

  function selectScene(next: ReceiptPreviewScene) {
    setDialogOpen(false);
    setScene(next);
  }

  return {
    scene,
    order,
    dialogOpen,
    canPreviewConfirmation,
    selectScene,
    openDialog: () => { if (canPreviewConfirmation) setDialogOpen(true); },
    closeDialog: () => setDialogOpen(false),
    // Deliberately a scene transition, never a write action or an API command.
    previewConfirmation: () => { if (dialogOpen && canPreviewConfirmation) selectScene('confirmed'); },
  };
}

export function formatReceiptPreviewPrice(value: number) {
  return `$${value.toFixed(2)} MXN`;
}
