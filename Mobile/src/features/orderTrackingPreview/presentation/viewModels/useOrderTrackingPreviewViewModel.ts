import { useState } from 'react';
import type { OrderTrackingPreview, OrderTrackingPreviewScenario } from '../../domain/models/OrderTrackingPreview';
import type { LoadOrderTrackingPreview } from '../../domain/useCases/loadOrderTrackingPreview';

type PreviewState = Readonly<{
  scenario: OrderTrackingPreviewScenario;
  state: OrderTrackingPreview;
  notice: string | null;
}>;

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const initialScenario: OrderTrackingPreviewScenario = 'pending_review';

/** Screen state for a local visual composition, separate from authenticated order history. */
export function useOrderTrackingPreviewViewModel(loadPreview: LoadOrderTrackingPreview) {
  const [preview, setPreview] = useState<PreviewState>(() => ({
    scenario: initialScenario, state: loadPreview(initialScenario), notice: null,
  }));

  function showScenario(scenario: OrderTrackingPreviewScenario) {
    setPreview({ scenario, state: loadPreview(scenario), notice: null });
  }

  function refreshPreview() {
    setPreview((current) => ({ ...current, state: loadPreview(current.scenario),
      notice: 'La muestra visual se actualizó. No se consultó ningún pedido real.' }));
  }

  function retryPreview() {
    setPreview({ scenario: initialScenario, state: loadPreview(initialScenario),
      notice: 'Se recuperó el ejemplo local. Esta acción solo demuestra el diseño.' });
  }

  return { ...preview, showScenario, refreshPreview, retryPreview,
    formatPrice: (amount: number) => `${money.format(amount)} MXN` };
}
