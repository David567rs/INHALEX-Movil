import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../users/enums/user-role.enum';
import { OrderStatus } from './enums/order-status.enum';
import { OrdersService } from './orders.service';
import {
  OrderCustomerReceiptStatus,
  OrderItemFulfillment,
} from './schemas/order.schema';

const user: JwtPayload = {
  sub: '507f1f77bcf86cd799439021',
  email: 'cliente@demo.mx',
  role: UserRole.USER,
};

function buildOrder(
  receiptStatus:
    | OrderCustomerReceiptStatus
    | null
    | undefined = OrderCustomerReceiptStatus.PENDING,
) {
  return {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    id: '507f1f77bcf86cd799439011',
    reference: 'PED-DEMO-RECEPCION',
    status: OrderStatus.COMPLETED,
    customerUserId: user.sub,
    customerUserEmail: user.email,
    customer: { name: 'Cliente Demo', email: user.email, phone: '5555555555' },
    customerReceiptStatus: receiptStatus,
    customerReceiptConfirmedAt: undefined as Date | undefined,
    completedAt: new Date('2026-11-01T12:00:00.000Z'),
    totalItems: 2,
    subtotal: 120,
    currency: 'MXN',
    items: [
      {
        productId: '507f1f77bcf86cd799439012',
        productName: 'Toronjil Demo',
        productSlug: 'toronjil-demo',
        image: '/toronjil.jpg',
        category: 'aromas',
        presentation: '10 ml',
        origin: 'Demo',
        unitPrice: 60,
        currency: 'MXN',
        requestedQuantity: 2,
        quantity: 2,
        subtotal: 120,
        fulfillment: OrderItemFulfillment.AVAILABLE,
        reservedQuantity: 2,
        backorderQuantity: 0,
        inventoryTracked: true,
        allowBackorder: false,
      },
    ],
    statusNotes: [] as unknown[],
  };
}

type ReceiptRecord = ReturnType<typeof buildOrder>;
type Query = Record<string, unknown>;
type ReceiptUpdate = {
  $set: Partial<ReceiptRecord>;
  $push: { statusNotes: unknown };
};

function snapshot(order: ReceiptRecord): ReceiptRecord {
  return {
    ...order,
    customer: { ...order.customer },
    items: order.items.map((item) => ({ ...item })),
    statusNotes: [...order.statusNotes],
  };
}

// The fake applies each query to the current record, including during a write.
// It does not decide eligibility itself: omitting the atomic guard must fail tests.
function matches(record: ReceiptRecord, query: Query): boolean {
  return Object.entries(query).every(([key, expected]) => {
    if (key === '$or') {
      return (expected as Query[]).some((condition) =>
        matches(record, condition),
      );
    }
    const actual = key.split('.').reduce<unknown>((value, segment) => {
      return (value as Record<string, unknown> | undefined)?.[segment];
    }, record);
    if (expected && typeof expected === 'object' && '$in' in expected) {
      return (expected.$in as unknown[]).includes(actual ?? null);
    }
    return String(actual) === String(expected);
  });
}

describe('OrdersService customer receipt', () => {
  let service: OrdersService;
  let stored: ReceiptRecord | null;
  let beforeUpdate: (() => void) | undefined;
  let writes: number;
  let model: {
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
  };
  let notifications: { createForUser: jest.Mock };

  beforeEach(() => {
    stored = buildOrder();
    writes = 0;
    beforeUpdate = undefined;
    notifications = { createForUser: jest.fn().mockResolvedValue(undefined) };
    model = {
      findOne: jest.fn((query: Query) => ({
        exec: () =>
          Promise.resolve(
            stored && matches(stored, query) ? snapshot(stored) : null,
          ),
      })),
      findOneAndUpdate: jest.fn((query: Query, update: ReceiptUpdate) => ({
        exec: () => {
          beforeUpdate?.();
          if (!stored || !matches(stored, query)) return Promise.resolve(null);
          stored = {
            ...stored,
            ...update.$set,
            statusNotes: [...stored.statusNotes, update.$push.statusNotes],
          };
          writes += 1;
          return Promise.resolve(snapshot(stored));
        },
      })),
    };
    type Dependencies = ConstructorParameters<typeof OrdersService>;
    service = new OrdersService(
      {} as Dependencies[0],
      {} as Dependencies[1],
      model as unknown as Dependencies[2],
      {} as Dependencies[3],
      {} as Dependencies[4],
      {} as Dependencies[5],
      {} as Dependencies[6],
      notifications as unknown as Dependencies[7],
    );
  });

  it('confirma una vez dos solicitudes que leyeron pendiente a la vez', async () => {
    const id = stored!.id;
    const [first, second] = await Promise.all([
      service.confirmCustomerReceipt(id, user),
      service.confirmCustomerReceipt(id, user),
    ]);

    expect(model.findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(writes).toBe(1);
    expect(stored!.statusNotes).toHaveLength(1);
    expect(notifications.createForUser).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
    expect(first).toMatchObject({
      id,
      reference: 'PED-DEMO-RECEPCION',
      status: OrderStatus.COMPLETED,
      customerReceiptStatus: OrderCustomerReceiptStatus.CONFIRMED,
      totalItems: 2,
      subtotal: 120,
    });
    expect(first.customerReceiptConfirmedAt).toEqual(expect.any(String));
  });

  it.each([OrderCustomerReceiptStatus.NOT_REQUIRED, null, undefined])(
    'acepta un completado antiguo con estado de recepción %s',
    async (state) => {
      stored!.customerReceiptStatus = state;
      const result = await service.confirmCustomerReceipt(stored!.id, user);
      expect(result.customerReceiptStatus).toBe(
        OrderCustomerReceiptStatus.CONFIRMED,
      );
      expect(writes).toBe(1);
      expect(stored!.statusNotes).toHaveLength(1);
    },
  );

  it('devuelve la confirmación previa sin cambiar fecha ni repetir efectos', async () => {
    stored!.customerReceiptStatus = OrderCustomerReceiptStatus.CONFIRMED;
    stored!.customerReceiptConfirmedAt = new Date('2026-11-02T12:00:00.000Z');
    const result = await service.confirmCustomerReceipt(stored!.id, user);
    expect(result.customerReceiptConfirmedAt).toBe('2026-11-02T12:00:00.000Z');
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
    expect(notifications.createForUser).not.toHaveBeenCalled();
  });

  it('rechaza una incidencia existente sin escribir ni notificar', async () => {
    stored!.customerReceiptStatus = OrderCustomerReceiptStatus.ISSUE_REPORTED;
    await expect(
      service.confirmCustomerReceipt(stored!.id, user),
    ).rejects.toThrow(ConflictException);
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
    expect(notifications.createForUser).not.toHaveBeenCalled();
  });

  it('no sobrescribe una incidencia que apareció después de leer el pedido', async () => {
    beforeUpdate = () => {
      stored!.customerReceiptStatus = OrderCustomerReceiptStatus.ISSUE_REPORTED;
    };
    await expect(
      service.confirmCustomerReceipt(stored!.id, user),
    ).rejects.toThrow(
      'Este pedido ya tiene una incidencia de entrega registrada.',
    );
    expect(writes).toBe(0);
    expect(stored!.statusNotes).toHaveLength(0);
    expect(notifications.createForUser).not.toHaveBeenCalled();
  });

  it.each([
    OrderStatus.PENDING_REVIEW,
    OrderStatus.CONFIRMED,
    OrderStatus.CANCELLED,
  ])('no confirma un pedido con estado general %s', async (status) => {
    stored!.status = status;
    await expect(
      service.confirmCustomerReceipt(stored!.id, user),
    ).rejects.toThrow(NotFoundException);
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('no lee ni confirma pedidos de otra cuenta', async () => {
    const otherUser = { ...user, sub: 'other-account', email: 'otra@demo.mx' };
    await expect(
      service.confirmCustomerReceipt(stored!.id, otherUser),
    ).rejects.toThrow(NotFoundException);
    expect(writes).toBe(0);
    expect(notifications.createForUser).not.toHaveBeenCalled();
  });

  it('revalida estado y propiedad al escribir, no solo al leer', async () => {
    beforeUpdate = () => {
      stored!.customerUserId = 'other-account';
      stored!.customerUserEmail = 'otra@demo.mx';
      stored!.customer.email = 'otra@demo.mx';
    };
    await expect(
      service.confirmCustomerReceipt(stored!.id, user),
    ).rejects.toThrow(NotFoundException);
    expect(writes).toBe(0);
    expect(notifications.createForUser).not.toHaveBeenCalled();
  });

  it('conserva compatibilidad de propiedad por correo de pedidos anteriores', async () => {
    stored!.customerUserId = 'legacy-id';
    stored!.customerUserEmail = 'legacy@demo.mx';
    const result = await service.confirmCustomerReceipt(stored!.id, {
      ...user,
      email: ' Cliente@Demo.mx ',
    });
    expect(result.customerReceiptStatus).toBe(
      OrderCustomerReceiptStatus.CONFIRMED,
    );
    expect(writes).toBe(1);
  });

  it('rechaza un id inválido antes de acceder al modelo', async () => {
    await expect(
      service.confirmCustomerReceipt('invalid', user),
    ).rejects.toThrow(BadRequestException);
    expect(model.findOne).not.toHaveBeenCalled();
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('un fallo de aviso posterior al guardado permite recuperar sin reconfirmar', async () => {
    const id = stored!.id;
    notifications.createForUser.mockRejectedValueOnce(
      new Error('notice unavailable'),
    );
    await expect(service.confirmCustomerReceipt(id, user)).rejects.toThrow(
      'notice unavailable',
    );
    const confirmedAt = stored!.customerReceiptConfirmedAt;
    const recovered = await service.confirmCustomerReceipt(id, user);
    expect(recovered.customerReceiptConfirmedAt).toBe(
      confirmedAt!.toISOString(),
    );
    expect(recovered.customerReceiptStatus).toBe(
      OrderCustomerReceiptStatus.CONFIRMED,
    );
    expect(writes).toBe(1);
    expect(stored!.statusNotes).toHaveLength(1);
    expect(notifications.createForUser).toHaveBeenCalledTimes(1);
  });
});
