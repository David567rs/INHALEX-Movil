import type { AuthSession, AuthSessionState } from '../../../auth/domain/session/AuthSession';
import type { Cart } from '../../../cart/domain/models/Cart';
import type { ShippingAddress } from '../../../shippingAddresses/domain/models/ShippingAddress';
import { OrderCreationError } from '../../domain/errors/OrderCreationError';
import type { OrderContactDraft, OrderContactField, OrderContactFieldErrors, OrderContext,
  OrderItemInput, OrderQuote, OrderReceipt } from '../../domain/models/OrderCreation';
import type { OrderCreationActions } from '../../domain/repositories/OrderCreationRepository';
import type { OrderAttempt, OrderAttemptStore } from '../../domain/storage/OrderAttemptStore';
import { isOrderIdempotencyKey, normalizeOrderConfirmInput, validateOrderContactDraft } from '../../domain/validation/orderCreationValidation';

export interface CheckoutLease { isCurrent(): boolean; release(confirmedCart?: Cart): void }
export interface OrderCreationState {
  readonly status: 'checking' | 'anonymous' | 'recovery-error' | 'ready' | 'expired';
  readonly context: OrderContext | null;
  readonly quote: OrderQuote | null;
  readonly selectedAddressId: string | null;
  readonly contact: OrderContactDraft | null;
  readonly fieldErrors: OrderContactFieldErrors & { readonly shippingAddressId?: string };
  readonly loading: boolean;
  readonly confirming: boolean;
  readonly recovering: boolean;
  readonly receipt: OrderReceipt | null;
  readonly message: string | null;
  readonly requiresRefresh: boolean;
  readonly uncertain: boolean;
  readonly cleanupPending: boolean;
}

const INITIAL_FIELDS = Object.freeze({});
function initial(auth: AuthSessionState): OrderCreationState {
  return Object.freeze({ status: auth.status === 'authenticated' ? 'ready' : auth.status,
    context: null, quote: null, selectedAddressId: null, contact: null, fieldErrors: INITIAL_FIELDS,
    loading: false, confirming: false, recovering: false, receipt: null, message: auth.message,
    requiresRefresh: false, uncertain: false, cleanupPending: false });
}
const itemsOf = (cart: Cart): readonly OrderItemInput[] => Object.freeze(cart.items.map(({ productId, quantity }) => Object.freeze({ productId, quantity })));
function sameItems(left: readonly OrderItemInput[], right: readonly OrderItemInput[]): boolean {
  if (left.length !== right.length) return false;
  const entries = new Map(left.map((item) => [item.productId, item.quantity]));
  return entries.size === left.length && new Set(right.map((item) => item.productId)).size === right.length
    && right.every((item) => entries.get(item.productId) === item.quantity);
}
function sameAddress(left: ShippingAddress | undefined, right: ShippingAddress | undefined): boolean {
  if (!left || !right) return false;
  return (['id', 'label', 'recipientName', 'phone', 'street', 'exteriorNumber', 'interiorNumber',
    'neighborhood', 'municipality', 'state', 'postalCode', 'references', 'isDefault'] as const)
    .every((field) => left[field] === right[field]);
}
function publicReceipt(value: OrderReceipt): OrderReceipt {
  return Object.freeze({ orderId: value.orderId, reference: value.reference, status: value.status,
    createdAt: value.createdAt, subtotal: value.subtotal, totalItems: value.totalItems, currency: value.currency });
}
const messageFor = (error: unknown) => error instanceof OrderCreationError ? error.message
  : 'No pudimos completar la operación. Inténtalo de nuevo.';

/** Recovery payloads and idempotency keys remain private and are persisted before a POST. */
export function createOrderCreationController(session: AuthSession, actions: OrderCreationActions, options: {
  attemptStore: OrderAttemptStore; createKey(): string; cart: { acquireCheckout(): CheckoutLease | null };
}) {
  let state = initial(session.getSnapshot());
  let active = false, opened = false, generation = 0;
  let observed: AuthSessionState | null = null, expired: AuthSessionState | null = null;
  let unsubscribe: (() => void) | null = null;
  let operation: AbortController | null = null;
  let lease: CheckoutLease | null = null;
  const attempts = new Map<string, OrderAttempt>();
  const listeners = new Set<() => void>();

  function publish(patch: Partial<OrderCreationState>) {
    state = Object.freeze({ ...state, ...patch });
    for (const listener of [...listeners]) { try { listener(); } catch { /* Observers cannot undo a server result. */ } }
  }
  function release(cart?: Cart) { const currentLease = lease; lease = null; currentLease?.release(cart); }
  function cancel() { generation++; operation?.abort(); operation = null; release(); }
  function available() {
    return active && opened && !operation && observed?.status === 'authenticated' && !!observed.user
      && observed === session.getSnapshot() && observed !== expired && state.status === 'ready';
  }
  function current(auth: AuthSessionState, id: number, abort: AbortController) {
    return active && opened && generation === id && operation === abort && !abort.signal.aborted
      && observed === auth && session.getSnapshot() === auth && auth.status === 'authenticated' && !!auth.user;
  }
  function expiredSession(auth: AuthSessionState) {
    expired = auth; cancel(); publish({ ...initial(auth), status: 'expired',
      message: 'Tu sesión ya no es válida. Inicia sesión de nuevo para consultar tu pedido.' });
  }
  function readFailure(error: unknown, auth: AuthSessionState) {
    if (error instanceof OrderCreationError && error.kind === 'unauthorized') { expiredSession(auth); return; }
    publish({ loading: false, recovering: false, confirming: false, message: messageFor(error), requiresRefresh: true });
  }
  function begin(needsLease: boolean) {
    if (!available() || !observed?.user) return null;
    if (needsLease) {
      lease = options.cart.acquireCheckout();
      if (!lease) { publish({ message: 'Espera a que termine la actualización de tu bolsa.' }); return null; }
    }
    const abort = new AbortController(); operation = abort;
    return { auth: observed, accountId: observed.user.id, id: generation, abort };
  }
  type Operation = NonNullable<ReturnType<typeof begin>>;
  const live = (task: Operation) => current(task.auth, task.id, task.abort);
  const owned = (task: Operation) => live(task) && !!lease?.isCurrent();
  function finish(task: Operation) { if (operation === task.abort) { operation = null; release(); } }
  function validateOwner(context: OrderContext, task: Operation) {
    if (context.profile.id !== task.accountId) {
      throw new OrderCreationError('No pudimos comprobar los datos de tu cuenta. Actualiza el resumen antes de continuar.', 'invalid-response');
    }
  }

  async function readContext(task: Operation): Promise<boolean> {
    const context = await actions.load({ signal: task.abort.signal });
    if (!live(task)) return false;
    validateOwner(context, task);
    const requestItems = itemsOf(context.cart);
    const quote = requestItems.length ? await actions.preview(requestItems, { signal: task.abort.signal }) : null;
    if (!live(task)) return false;
    const selected = context.addresses.find((address) => address.id === state.selectedAddressId)
      ?? context.addresses.find((address) => address.isDefault) ?? context.addresses[0];
    const contact = state.contact ?? Object.freeze({ customerName: `${context.profile.firstName} ${context.profile.lastName}`.trim(),
      customerEmail: context.profile.email, customerPhone: context.profile.phone, notes: '' });
    publish({ context, quote, selectedAddressId: selected?.id ?? null, contact,
      loading: false, recovering: false, requiresRefresh: false });
    return true;
  }

  async function refresh(): Promise<void> {
    const task = begin(false); if (!task) return;
    publish({ loading: state.context === null, recovering: true, message: null });
    try {
      const stored = await options.attemptStore.get(task.accountId);
      if (!live(task)) return;
      const remembered = attempts.get(task.accountId);
      const attempt = stored?.phase === 'confirmed' && (!remembered || remembered.key === stored.key)
        ? stored : remembered ?? stored;
      if (attempt) {
        attempts.set(task.accountId, attempt);
        if (attempt.phase === 'confirmed' && attempt.receipt) {
          publish({ receipt: publicReceipt(attempt.receipt), cleanupPending: true, uncertain: false,
            loading: false, recovering: false, requiresRefresh: false,
            message: 'Tu pedido ya fue creado. Revisa la actualización pendiente de tu bolsa.' });
          return;
        }
        publish({ uncertain: true, cleanupPending: !!state.receipt, message: 'Hay una confirmación pendiente. Reintenta la misma solicitud para conocer su resultado.' });
      }
      await readContext(task);
    } catch (error) { if (live(task)) readFailure(error, task.auth); }
    finally { finish(task); }
  }

  async function clearAttempt(task: Operation): Promise<boolean> {
    const expected = attempts.get(task.accountId);
    await options.attemptStore.clear(task.accountId);
    // Storage completion remains authoritative even when its screen/account has changed.
    if (attempts.get(task.accountId) === expected) attempts.delete(task.accountId);
    if (!live(task)) return false;
    return true;
  }

  async function cleanup(task: Operation, attempt: OrderAttempt): Promise<void> {
    if (attempt.phase !== 'confirmed' || !attempt.receipt || !owned(task)) return;
    publish({ recovering: true, cleanupPending: true, message: null });
    try {
      const fresh = await actions.readCart({ signal: task.abort.signal });
      if (!owned(task)) return;
      const canClear = sameItems(itemsOf(fresh), attempt.input.items) && attempt.normalizedItems !== null
        && sameItems(attempt.normalizedItems, attempt.input.items);
      let confirmed = fresh;
      if (fresh.items.length && canClear) {
        confirmed = await actions.clearCart({ signal: task.abort.signal });
        if (!owned(task)) return;
        if (confirmed.items.length) throw new OrderCreationError('Tu pedido fue creado, pero falta comprobar la bolsa.', 'invalid-response');
      }
      if (!await clearAttempt(task) || !owned(task)) return;
      release(confirmed);
      publish({ receipt: publicReceipt(attempt.receipt), cleanupPending: false, uncertain: false,
        recovering: false, confirming: false, requiresRefresh: false,
        context: state.context ? Object.freeze({ ...state.context, cart: confirmed }) : null,
        message: fresh.items.length && !canClear
          ? 'Tu pedido fue creado. Conservamos la bolsa porque sus productos o cantidades son diferentes.'
          : 'Tu pedido se creó correctamente y tu bolsa está actualizada.' });
    } catch (error) {
      if (!live(task)) return;
      if (error instanceof OrderCreationError && error.kind === 'unauthorized') { expiredSession(task.auth); return; }
      publish({ receipt: publicReceipt(attempt.receipt), cleanupPending: true, uncertain: false,
        recovering: false, confirming: false, requiresRefresh: false,
        message: 'Tu pedido ya fue creado. Reintenta actualizar la bolsa; no se enviará otro pedido.' });
    }
  }

  async function sendConfirmation(task: Operation, attempt: OrderAttempt): Promise<void> {
    let posted = false;
    try {
      if (!owned(task)) return;
      posted = true;
      const confirmation = await actions.confirm(attempt.input, attempt.key, { signal: task.abort.signal });
      if (!owned(task)) return;
      const receipt = publicReceipt(confirmation);
      const confirmed: OrderAttempt = Object.freeze({ ...attempt, phase: 'confirmed', receipt,
        normalizedItems: Object.freeze(confirmation.items.map(({ productId, quantity }) => Object.freeze({ productId, quantity }))) });
      publish({ receipt, cleanupPending: true });
      // Durable confirmation must precede any deletion of the account's cart.
      await options.attemptStore.set(task.accountId, confirmed);
      if (attempts.get(task.accountId)?.key === attempt.key) attempts.set(task.accountId, confirmed);
      if (!owned(task)) return;
      publish({ uncertain: false, confirming: false });
      await cleanup(task, confirmed);
    } catch (error) {
      if (!live(task)) return;
      if (error instanceof OrderCreationError && error.kind === 'unauthorized') { expiredSession(task.auth); return; }
      const definite = posted && !state.receipt && error instanceof OrderCreationError
        && (error.kind === 'invalid-request' || error.kind === 'conflict');
      if (definite) {
        try {
          if (!await clearAttempt(task)) return;
          publish({ confirming: false, uncertain: false, fieldErrors: Object.freeze({ ...error.fieldErrors }), requiresRefresh: true });
          await readContext(task);
          if (live(task)) publish({ message: 'El pedido no se creó. Revisa el resumen actualizado antes de confirmar otra vez.' });
        } catch (readError) {
          if (live(task)) publish({ confirming: false, recovering: false, uncertain: attempts.has(task.accountId), requiresRefresh: true,
            message: messageFor(readError) });
        }
        return;
      }
      publish({ confirming: false, recovering: false, uncertain: true, cleanupPending: !!state.receipt,
        message: state.receipt
          ? 'El pedido fue creado, pero falta guardar su recuperación. Reintenta la misma confirmación antes de actualizar la bolsa.'
          : 'No pudimos confirmar el resultado. Reintenta la misma solicitud; no cambies ni vuelvas a crear el pedido.' });
    }
  }

  async function confirm(): Promise<void> {
    if (!available() || state.uncertain || state.cleanupPending || state.receipt || state.requiresRefresh
      || !state.context || !state.quote || !state.quote.canConfirmOrder || !state.contact) return;
    const validation = validateOrderContactDraft(state.contact);
    const address = state.context.addresses.find((value) => value.id === state.selectedAddressId);
    if (!validation.valid || !address) {
      publish({ fieldErrors: Object.freeze({ ...validation.errors,
        ...(!address ? { shippingAddressId: 'Selecciona una dirección de envío registrada.' } : {}) }),
      message: 'Revisa los datos de contacto y la dirección de envío.' });
      return;
    }
    const oldContext = state.context, quote = state.quote;
    const task = begin(true); if (!task) return;
    publish({ confirming: true, message: null, fieldErrors: INITIAL_FIELDS });
    try {
      const fresh = await actions.load({ signal: task.abort.signal });
      if (!owned(task)) return;
      validateOwner(fresh, task);
      if (!sameItems(itemsOf(fresh.cart), itemsOf(oldContext.cart))
        || !sameAddress(address, fresh.addresses.find((value) => value.id === address.id))) {
        await readContext(task);
        if (live(task)) publish({ confirming: false, message: 'La bolsa o la dirección cambió. Revisa el resumen actualizado antes de confirmar.' });
        return;
      }
      const input = normalizeOrderConfirmInput({ ...validation.values, items: itemsOf(oldContext.cart),
        shippingAddressId: address.id, previewSignature: quote.signature });
      const key = options.createKey();
      if (!isOrderIdempotencyKey(key)) throw new OrderCreationError('No pudimos preparar una confirmación segura.', 'configuration');
      const attempt: OrderAttempt = Object.freeze({ version: 1, accountId: task.accountId, key,
        input, phase: 'pending', receipt: null, normalizedItems: null });
      attempts.set(task.accountId, attempt);
      // Register privately before awaiting storage so closing/reopening cannot rotate this key.
      await options.attemptStore.set(task.accountId, attempt);
      if (!owned(task)) return;
      await sendConfirmation(task, attempt);
    } catch (error) {
      if (!live(task)) return;
      if (error instanceof OrderCreationError && error.kind === 'unauthorized') { expiredSession(task.auth); return; }
      const pending = attempts.has(task.accountId);
      publish({ confirming: false, uncertain: pending, requiresRefresh: !pending,
        message: pending ? 'No pudimos guardar una confirmación segura. No se envió el pedido; reintenta la misma solicitud.' : messageFor(error) });
    } finally { finish(task); }
  }

  async function retryConfirmation(): Promise<void> {
    if (!available() || !observed?.user) return;
    const attempt = attempts.get(observed.user.id);
    if (!attempt || attempt.phase !== 'pending') return;
    const task = begin(true); if (!task) return;
    publish({ confirming: true, recovering: true, message: null });
    try {
      // A previous storage failure must be repaired before a first or repeated POST.
      await options.attemptStore.set(task.accountId, attempt);
      if (!owned(task)) return;
      await sendConfirmation(task, attempt);
    } catch {
      if (live(task)) publish({ confirming: false, recovering: false, uncertain: true,
        message: 'No pudimos guardar una confirmación segura. La solicitud pendiente se conserva para reintentar.' });
    } finally { finish(task); }
  }

  async function reconcileCart(): Promise<void> {
    if (!available() || !observed?.user) return;
    const attempt = attempts.get(observed.user.id);
    if (!attempt || attempt.phase !== 'confirmed') return;
    const task = begin(true); if (!task) return;
    try { await cleanup(task, attempt); } finally { finish(task); }
  }

  function synchronize() {
    const auth = session.getSnapshot();
    if (auth === observed) return;
    cancel(); observed = auth;
    publish(auth === expired ? { ...initial(auth), status: 'expired', message: 'Inicia sesión de nuevo para consultar tu pedido.' } : initial(auth));
    if (opened && auth.status === 'authenticated' && auth !== expired) void refresh();
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    start() { if (active) return; active = true; unsubscribe = session.subscribe(synchronize); synchronize(); },
    stop() { if (!active) return; active = false; opened = false; unsubscribe?.(); unsubscribe = null; cancel(); observed = null; publish(initial(session.getSnapshot())); },
    open(): Promise<void> { if (opened) return Promise.resolve(); opened = true; return refresh(); },
    close() { opened = false; cancel(); publish(observed === expired && observed ? { ...initial(observed), status: 'expired' } : initial(session.getSnapshot())); },
    refresh, confirm, retryConfirmation, reconcileCart,
    selectAddress(id: string) {
      if (!available() || state.uncertain || state.receipt || !state.context?.addresses.some((address) => address.id === id)) return;
      publish({ selectedAddressId: id, fieldErrors: Object.freeze({ ...state.fieldErrors, shippingAddressId: undefined }), message: null });
    },
    editContact(field: OrderContactField, value: string) {
      if (!available() || state.uncertain || state.receipt || !state.contact
        || !(['customerName', 'customerEmail', 'customerPhone', 'notes'] as const).includes(field)) return;
      const errors = { ...state.fieldErrors }; delete errors[field];
      publish({ contact: Object.freeze({ ...state.contact, [field]: value }), fieldErrors: Object.freeze(errors),
        message: state.requiresRefresh ? state.message : null });
    },
  };
}

export type OrderCreationController = ReturnType<typeof createOrderCreationController>;
