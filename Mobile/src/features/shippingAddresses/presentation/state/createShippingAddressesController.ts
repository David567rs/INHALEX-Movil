import type { AuthSession, AuthSessionState } from '../../../auth/domain/session/AuthSession';
import { ShippingAddressError } from '../../domain/errors/ShippingAddressError';
import type { ShippingAddress, ShippingAddressDraft, ShippingAddressField, ShippingAddressFieldErrors } from '../../domain/models/ShippingAddress';
import type { ShippingAddressActions } from '../../domain/useCases/shippingAddressActions';
import { MAX_SHIPPING_ADDRESSES, SHIPPING_ADDRESS_FIELDS, validateShippingAddressDraft } from '../../domain/validation/shippingAddressValidation';

export interface ShippingAddressesState {
  readonly status: 'checking' | 'recovery-error' | 'anonymous' | 'ready' | 'expired';
  readonly addresses: readonly ShippingAddress[] | null;
  readonly mode: 'list' | 'create' | 'edit';
  readonly editingId: string | null;
  readonly draft: ShippingAddressDraft | null;
  readonly fieldErrors: ShippingAddressFieldErrors;
  readonly loading: boolean;
  readonly refreshing: boolean;
  readonly saving: boolean;
  readonly pendingId: string | null;
  readonly message: string | null;
  readonly confirmation: string | null;
  readonly requiresRefresh: boolean;
}

function initialState(auth: AuthSessionState): ShippingAddressesState {
  return Object.freeze({
    status: auth.status === 'authenticated' ? 'ready' : auth.status,
    addresses: null, mode: 'list', editingId: null, draft: null, fieldErrors: Object.freeze({}),
    loading: false, refreshing: false, saving: false, pendingId: null,
    message: auth.message, confirmation: null, requiresRefresh: false,
  });
}

function expiredState(auth: AuthSessionState): ShippingAddressesState {
  return Object.freeze({ ...initialState(auth), status: 'expired',
    message: 'Tu sesión ya no es válida. Inicia sesión de nuevo para consultar tus direcciones.' });
}

function emptyDraft(isDefault: boolean): ShippingAddressDraft {
  return Object.freeze({ label: '', recipientName: '', phone: '', street: '', exteriorNumber: '', interiorNumber: '',
    neighborhood: '', municipality: '', state: '', postalCode: '', references: '', isDefault });
}

/** Strip identifiers and any transport-only properties from an editable draft. */
function draftFrom(address: ShippingAddressDraft): ShippingAddressDraft {
  return Object.freeze({ label: address.label, recipientName: address.recipientName, phone: address.phone,
    street: address.street, exteriorNumber: address.exteriorNumber, interiorNumber: address.interiorNumber,
    neighborhood: address.neighborhood, municipality: address.municipality, state: address.state,
    postalCode: address.postalCode, references: address.references, isDefault: address.isDefault });
}

function confirmedAddresses(addresses: readonly ShippingAddress[]): readonly ShippingAddress[] {
  return Object.freeze(addresses.map((address) => Object.freeze({ ...draftFrom(address), id: address.id })));
}

const safeReadError = (error: unknown) => error instanceof ShippingAddressError
  ? error.message : 'No pudimos cargar tus direcciones. Inténtalo de nuevo.';
const safeMutationError = (error: unknown) => error instanceof ShippingAddressError
  ? error.message : 'No pudimos confirmar el cambio. Reintenta la consulta antes de volver a guardar.';

/** The injected authorization session changes only when the authenticated session changes. */
export function createShippingAddressesController(session: AuthSession, actions: ShippingAddressActions) {
  let state = initialState(session.getSnapshot());
  let active = false;
  let generation = 0;
  let observedSession: AuthSessionState | null = null;
  let expiredSession: AuthSessionState | null = null;
  let unsubscribeSession: (() => void) | null = null;
  let pendingOperation: AbortController | null = null;
  const listeners = new Set<() => void>();

  function publish(patch: Partial<ShippingAddressesState>) {
    state = Object.freeze({ ...state, ...patch });
    for (const listener of [...listeners]) {
      try { listener(); }
      catch { /* Observer failures must not change confirmed server results. */ }
    }
  }

  function cancelOperations() {
    generation++;
    pendingOperation?.abort();
    pendingOperation = null;
  }

  function current(auth: AuthSessionState, requestId: number, controller: AbortController) {
    return active && generation === requestId && !controller.signal.aborted
      && observedSession === auth && session.getSnapshot() === auth
      && auth.status === 'authenticated' && auth.user !== null;
  }

  function available() {
    return active && observedSession?.status === 'authenticated' && observedSession.user !== null
      && session.getSnapshot() === observedSession && state.status === 'ready' && !pendingOperation;
  }

  function expireSession(auth: AuthSessionState) {
    cancelOperations();
    expiredSession = auth;
    publish(expiredState(auth));
  }

  async function refresh(): Promise<void> {
    const auth = observedSession;
    if (!available() || !auth) return;
    const controller = new AbortController();
    const requestId = generation;
    pendingOperation = controller;
    publish({ loading: state.addresses === null, refreshing: state.addresses !== null,
      message: null, confirmation: null });
    try {
      if (!current(auth, requestId, controller)) return;
      const addresses = await actions.list({ signal: controller.signal });
      if (!current(auth, requestId, controller)) return;
      const snapshot = confirmedAddresses(addresses);
      const editingPrincipal = state.mode === 'edit'
        && snapshot.some((address) => address.id === state.editingId && address.isDefault);
      const draft = editingPrincipal && state.draft && !state.draft.isDefault
        ? Object.freeze({ ...state.draft, isDefault: true }) : state.draft;
      pendingOperation = null;
      // Reconciliation updates confirmed rows while preserving a form the user is reviewing.
      publish({ addresses: snapshot, draft, loading: false, refreshing: false, message: null, requiresRefresh: false });
    } catch (error) {
      if (!current(auth, requestId, controller)) return;
      if (error instanceof ShippingAddressError && error.kind === 'unauthorized') {
        expireSession(auth);
        return;
      }
      pendingOperation = null;
      publish({ loading: false, refreshing: false, message: safeReadError(error), requiresRefresh: true });
    } finally {
      if (pendingOperation === controller) pendingOperation = null;
    }
  }

  async function mutate(operation: (signal: AbortSignal) => Promise<readonly ShippingAddress[]>,
    pendingId: string | null, confirmation: string): Promise<void> {
    const auth = observedSession;
    if (!available() || !auth || state.addresses === null || state.requiresRefresh) return;
    const controller = new AbortController();
    const requestId = generation;
    pendingOperation = controller;
    publish({ saving: true, pendingId, message: null, confirmation: null, fieldErrors: Object.freeze({}) });
    try {
      if (!current(auth, requestId, controller)) return;
      const addresses = await operation(controller.signal);
      if (!current(auth, requestId, controller)) return;
      const snapshot = confirmedAddresses(addresses);
      pendingOperation = null;
      publish({ addresses: snapshot, saving: false, pendingId: null, mode: 'list', editingId: null,
        draft: null, fieldErrors: Object.freeze({}), requiresRefresh: false, message: null, confirmation });
    } catch (error) {
      if (!current(auth, requestId, controller)) return;
      if (error instanceof ShippingAddressError && error.kind === 'unauthorized') {
        expireSession(auth);
        return;
      }
      const validationError = error instanceof ShippingAddressError && error.kind === 'validation';
      pendingOperation = null;
      // A mutation may have committed. Require GET before another write and never resend it automatically.
      publish({ saving: false, pendingId: null, message: safeMutationError(error), requiresRefresh: !validationError,
        fieldErrors: Object.freeze({ ...(validationError ? error.fieldErrors : {}) }) });
    } finally {
      if (pendingOperation === controller) pendingOperation = null;
    }
  }

  function synchronizeSession() {
    const auth = session.getSnapshot();
    if (!active || observedSession === auth) return;
    cancelOperations();
    observedSession = auth;
    if (auth === expiredSession) {
      publish(expiredState(auth));
      return;
    }
    expiredSession = null;
    publish(initialState(auth));
    if (auth.status === 'authenticated') void refresh();
  }

  async function save(): Promise<void> {
    if (!available() || state.addresses === null || !state.draft || state.mode === 'list' || state.requiresRefresh) return;
    if (state.mode === 'create' && state.addresses.length >= MAX_SHIPPING_ADDRESSES) {
      publish({ message: 'Puedes guardar hasta cinco direcciones.' });
      return;
    }
    const editingId = state.editingId;
    if (state.mode === 'edit' && !state.addresses.some((address) => address.id === editingId)) {
      publish({ message: 'Esta dirección ya no está disponible. Cancela la edición y revisa tus direcciones.' });
      return;
    }
    const validation = validateShippingAddressDraft(state.draft);
    if (!validation.valid) {
      publish({ fieldErrors: Object.freeze({ ...validation.errors }), message: 'Revisa los campos indicados.', confirmation: null });
      return;
    }
    const values = draftFrom(validation.values);
    if (state.mode === 'create') {
      const previousIds = new Set(state.addresses.map((address) => address.id));
      await mutate(async (signal) => {
        const addresses = await actions.create(values, { signal });
        const added = addresses.filter((address) => !previousIds.has(address.id));
        if (added.length !== 1 || !SHIPPING_ADDRESS_FIELDS.every((field) => added[0][field] === values[field])
          || (values.isDefault ? !added[0].isDefault : added[0].isDefault && addresses.length !== 1)) {
          throw new ShippingAddressError('No pudimos confirmar la nueva dirección. Actualiza la lista antes de intentarlo otra vez.', 'invalid-response');
        }
        return addresses;
      }, null, 'Tu dirección se guardó correctamente.');
    } else if (editingId) {
      await mutate((signal) => actions.update(editingId, values, { signal }), editingId, 'Tu dirección se actualizó correctamente.');
    }
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    start() {
      if (active) return;
      active = true;
      unsubscribeSession = session.subscribe(synchronizeSession);
      synchronizeSession();
    },
    stop() {
      if (!active) return;
      active = false;
      unsubscribeSession?.();
      unsubscribeSession = null;
      observedSession = null;
      cancelOperations();
      const auth = session.getSnapshot();
      state = auth === expiredSession ? expiredState(auth) : initialState(auth);
    },
    refresh,
    openCreate() {
      if (!available() || state.addresses === null || state.requiresRefresh) return;
      if (state.addresses.length >= MAX_SHIPPING_ADDRESSES) {
        publish({ message: 'Puedes guardar hasta cinco direcciones.' });
        return;
      }
      publish({ mode: 'create', editingId: null, draft: emptyDraft(state.addresses.length === 0),
        fieldErrors: Object.freeze({}), message: null, confirmation: null });
    },
    openEdit(id: string) {
      if (!available() || state.requiresRefresh) return;
      const address = state.addresses?.find((item) => item.id === id);
      if (!address) return;
      publish({ mode: 'edit', editingId: id, draft: draftFrom(address),
        fieldErrors: Object.freeze({}), message: null, confirmation: null });
    },
    updateField(field: ShippingAddressField, value: string) {
      if (!available() || state.mode === 'list' || !state.draft || !SHIPPING_ADDRESS_FIELDS.includes(field)) return;
      const fieldErrors = { ...state.fieldErrors };
      delete fieldErrors[field];
      publish({ draft: Object.freeze({ ...state.draft, [field]: value }), fieldErrors: Object.freeze(fieldErrors),
        message: state.requiresRefresh ? state.message : null, confirmation: null });
    },
    toggleDefault() {
      if (!available() || state.mode === 'list' || !state.draft) return;
      if (state.mode === 'edit' && state.addresses?.some((address) => address.id === state.editingId && address.isDefault)) return;
      publish({ draft: Object.freeze({ ...state.draft, isDefault: !state.draft.isDefault }), confirmation: null });
    },
    cancelForm() {
      if (!available()) return;
      publish({ mode: 'list', editingId: null, draft: null, fieldErrors: Object.freeze({}), confirmation: null,
        message: state.requiresRefresh ? state.message : null });
    },
    save,
    select(id: string) {
      if (state.mode !== 'list' || !state.addresses?.some((address) => address.id === id && !address.isDefault)) return Promise.resolve();
      return mutate((signal) => actions.select(id, { signal }), id, 'Se actualizó tu dirección principal.');
    },
    remove(id: string) {
      if (state.mode !== 'list' || !state.addresses?.some((address) => address.id === id)) return Promise.resolve();
      return mutate((signal) => actions.remove(id, { signal }), id, 'Tu dirección se eliminó correctamente.');
    },
    dismissConfirmation() { if (!pendingOperation && state.confirmation) publish({ confirmation: null }); },
  };
}

export type ShippingAddressesController = ReturnType<typeof createShippingAddressesController>;
