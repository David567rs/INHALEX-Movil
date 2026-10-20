import type {
  OrderTrackingPreview, OrderTrackingPreviewOrder, OrderTrackingPreviewScenario,
  OrderTrackingPreviewStatus, OrderTrackingPreviewStep,
} from '../../domain/models/OrderTrackingPreview';
import type { OrderTrackingPreviewRepository } from '../../domain/repositories/OrderTrackingPreviewRepository';

const labels: Readonly<Record<OrderTrackingPreviewStatus, string>> = Object.freeze({
  pending_review: 'En revisión', confirmed: 'Confirmado', completed: 'Completado', cancelled: 'Cancelado',
});

const items = Object.freeze([
  Object.freeze({ id: 'example-lavanda', name: 'Lavanda', presentation: '10 ml', quantity: 2, unitPrice: 129, lineTotal: 258 }),
  Object.freeze({ id: 'example-menta', name: 'Menta fresca', presentation: '10 ml', quantity: 1, unitPrice: 119, lineTotal: 119 }),
]);

const address = Object.freeze({
  label: 'Destino de ejemplo', recipientName: 'Persona de ejemplo',
  lines: Object.freeze(['Calle Muestra 12 · Colonia Jardín', 'Ciudad de ejemplo · CP 42000']),
});

function step(id: OrderTrackingPreviewStatus, state: OrderTrackingPreviewStep['state'], description: string): OrderTrackingPreviewStep {
  return Object.freeze({ id, label: labels[id], state, description, dateLabel: null });
}

function timeline(status: OrderTrackingPreviewStatus): readonly OrderTrackingPreviewStep[] {
  // A cancelled order may never have been confirmed. Do not present that step as an event.
  if (status === 'cancelled') return Object.freeze([
    step('pending_review', 'past', 'La selección de ejemplo quedó registrada.'),
    step('cancelled', 'current', 'Este ejemplo termina con un pedido cancelado.'),
  ]);
  return Object.freeze([
    step('pending_review', status === 'pending_review' ? 'current' : 'past',
      'La selección de ejemplo está registrada para revisión.'),
    step('confirmed', status === 'pending_review' ? 'upcoming' : status === 'confirmed' ? 'current' : 'past',
      status === 'pending_review' ? 'Etapa pendiente en este ejemplo.' : 'El pedido de ejemplo tiene confirmación.'),
    step('completed', status === 'completed' ? 'current' : 'upcoming',
      status === 'completed' ? 'Este ejemplo muestra un pedido completado.' : 'Etapa pendiente en este ejemplo.'),
  ]);
}

function order(status: OrderTrackingPreviewStatus): OrderTrackingPreviewOrder {
  return Object.freeze({ id: 'example-order-001', reference: 'EJEMPLO-001', status, statusLabel: labels[status],
    dateLabel: '19 de octubre de 2026', createdAt: '2026-10-19T16:30:00.000Z', currency: 'MXN',
    unitCount: 3, subtotal: 377, items, address, timeline: timeline(status) });
}

const samples: Readonly<Record<OrderTrackingPreviewScenario, OrderTrackingPreview>> = Object.freeze({
  pending_review: Object.freeze({ status: 'ready', order: order('pending_review') }),
  confirmed: Object.freeze({ status: 'ready', order: order('confirmed') }),
  completed: Object.freeze({ status: 'ready', order: order('completed') }),
  cancelled: Object.freeze({ status: 'ready', order: order('cancelled') }),
  'not-found': Object.freeze({ status: 'not-found', title: 'No encontramos este pedido',
    message: 'Esta composición muestra cómo se verá un pedido no disponible. No consulta pedidos de tu cuenta.' }),
  'connection-error': Object.freeze({ status: 'connection-error', title: 'No pudimos cargar el seguimiento',
    message: 'Este aviso es una muestra del diseño. Reintentar recupera el ejemplo sin consultar la API.' }),
});

/** Synthetic immutable snapshots. No session, HTTP, timers, persistence or order mutations. */
export class LocalOrderTrackingPreviewRepository implements OrderTrackingPreviewRepository {
  load(scenario: OrderTrackingPreviewScenario): OrderTrackingPreview {
    return samples[scenario];
  }
}
