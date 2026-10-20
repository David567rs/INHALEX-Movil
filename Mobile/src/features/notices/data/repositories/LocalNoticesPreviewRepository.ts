import type { NoticePreview, NoticesPreview, NoticesPreviewScene } from '../../domain/models/NoticePreview';
import type { NoticesPreviewRepository } from '../../domain/repositories/NoticesPreviewRepository';

const notices: readonly NoticePreview[] = Object.freeze([
  Object.freeze({
    id: 'EJEMPLO-AVISO-01',
    title: 'Tu pedido está en revisión',
    message: 'Recibimos tu selección. Puedes consultar su estado desde Historial de pedidos.',
    dateLabel: '20 de octubre de 2026',
    kind: 'order',
    read: false,
    reference: 'EJEMPLO-1042',
  }),
  Object.freeze({
    id: 'EJEMPLO-AVISO-02',
    title: 'Un espacio para ti',
    message: 'En Cuenta puedes consultar tus datos y mantenerlos actualizados.',
    dateLabel: '19 de octubre de 2026',
    kind: 'account',
    read: false,
  }),
  Object.freeze({
    id: 'EJEMPLO-AVISO-03',
    title: 'Tu dirección, a la mano',
    message: 'Desde Cuenta puedes revisar las direcciones que guardaste.',
    dateLabel: '18 de octubre de 2026',
    kind: 'account',
    read: true,
  }),
]);

const inbox: NoticesPreview = Object.freeze({ status: 'ready', items: notices });
const empty: NoticesPreview = Object.freeze({ status: 'ready', items: Object.freeze([] as const) });
const error: NoticesPreview = Object.freeze({
  status: 'error', message: 'No pudimos cargar los avisos. Inténtalo de nuevo.',
});

/** Fixed visual compositions only. Reading an example never changes its read status. */
export class LocalNoticesPreviewRepository implements NoticesPreviewRepository {
  load(scene: NoticesPreviewScene): NoticesPreview {
    return scene === 'error' ? error : scene === 'empty' ? empty : inbox;
  }
}
