import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { AuthSecurityService } from '../auth/auth-security.service';
import { UserRole } from '../users/enums/user-role.enum';
import { UserStatus } from '../users/enums/user-status.enum';
import { UsersService } from '../users/users.service';
import { AccountDeletionService } from './account-deletion.service';
import { AccountDeletionRequestDocument } from './schemas/account-deletion-request.schema';

jest.mock('bcrypt', () => ({ compare: jest.fn() }));

const ACCOUNT_ID = '507f1f77bcf86cd799439011';
const OTHER_ID = '507f1f77bcf86cd799439012';
const INPUT = {
  email: 'Demo@example.test',
  password: 'test-password',
  confirmation: 'ELIMINAR',
};
const CREATED_AT = new Date('2026-11-08T12:00:00.000Z');

function entry(id = ACCOUNT_ID) {
  return {
    _id: new Types.ObjectId(id),
    status: 'pending',
    createdAt: CREATED_AT,
  };
}

describe('AccountDeletionService', () => {
  const compare = bcrypt.compare as jest.Mock;
  let service: AccountDeletionService;
  let users: { findById: jest.Mock; findByEmail: jest.Mock };
  let security: {
    assertLoginAllowed: jest.Mock;
    registerFailedLogin: jest.Mock;
    clearLoginFailures: jest.Mock;
  };
  let model: {
    findById: jest.Mock;
    findOneAndUpdate: jest.Mock;
    find: jest.Mock;
  };
  let read: jest.Mock;
  let write: jest.Mock;
  let list: { sort: jest.Mock; limit: jest.Mock; exec: jest.Mock };
  let account: {
    _id: Types.ObjectId;
    email: string;
    passwordHash: string;
    status: UserStatus;
    role: UserRole;
  };

  beforeEach(() => {
    jest.resetAllMocks();
    account = {
      _id: new Types.ObjectId(ACCOUNT_ID),
      email: 'demo@example.test',
      passwordHash: 'hash',
      status: UserStatus.ACTIVE,
      role: UserRole.USER,
    };
    users = {
      findById: jest.fn().mockResolvedValue(account),
      findByEmail: jest.fn().mockResolvedValue(account),
    };
    security = {
      assertLoginAllowed: jest.fn(),
      registerFailedLogin: jest.fn(),
      clearLoginFailures: jest.fn(),
    };
    read = jest.fn().mockResolvedValue(entry());
    write = jest.fn().mockResolvedValue(entry());
    list = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };
    model = {
      findById: jest.fn().mockReturnValue({ exec: read }),
      findOneAndUpdate: jest.fn().mockReturnValue({ exec: write }),
      find: jest.fn().mockReturnValue(list),
    };
    compare.mockResolvedValue(true);
    service = new AccountDeletionService(
      model as unknown as Model<AccountDeletionRequestDocument>,
      users as unknown as UsersService,
      security as unknown as AuthSecurityService,
    );
  });

  it('returns only the current account receipt and checks active account existence', async () => {
    expect(await service.getOwn(ACCOUNT_ID)).toEqual({
      request: {
        id: ACCOUNT_ID,
        status: 'pending',
        createdAt: CREATED_AT.toISOString(),
      },
    });
    expect(users.findById).toHaveBeenCalledWith(ACCOUNT_ID);
    expect(model.findById).toHaveBeenCalledWith(ACCOUNT_ID);
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('returns an explicit empty result without creating a request', async () => {
    read.mockResolvedValue(null);
    expect(await service.getOwn(ACCOUNT_ID)).toEqual({ request: null });
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it.each(['invalid', ''])(
    'rejects malformed account id %s before querying data',
    async (id) => {
      await expect(service.getOwn(id)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(users.findById).not.toHaveBeenCalled();
      expect(model.findById).not.toHaveBeenCalled();
    },
  );

  it.each([null, { status: UserStatus.INACTIVE }])(
    'does not accept a removed or inactive JWT subject',
    async (user) => {
      users.findById.mockResolvedValue(user);
      await expect(service.getOwn(ACCOUNT_ID)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      await expect(
        service.requestOwn(ACCOUNT_ID, INPUT),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(model.findById).not.toHaveBeenCalled();
      expect(model.findOneAndUpdate).not.toHaveBeenCalled();
    },
  );

  it('reauthenticates and stores only an idempotent account-keyed pending request', async () => {
    const first = await service.requestOwn(ACCOUNT_ID, INPUT, '192.0.2.2');
    const repeated = await service.requestOwn(ACCOUNT_ID, INPUT, '192.0.2.2');
    expect(repeated).toEqual(first);
    expect(users.findByEmail).toHaveBeenCalledWith('demo@example.test', true);
    expect(compare).toHaveBeenCalledWith('test-password', 'hash');
    expect(security.assertLoginAllowed).toHaveBeenCalledWith(
      'demo@example.test',
      '192.0.2.2',
    );
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: new Types.ObjectId(ACCOUNT_ID) },
      {
        $setOnInsert: {
          status: 'pending',
          createdAt: expect.any(Date) as Date,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
    expect(JSON.stringify(model.findOneAndUpdate.mock.calls)).not.toContain(
      INPUT.password,
    );
    expect(JSON.stringify(model.findOneAndUpdate.mock.calls)).not.toContain(
      account.email,
    );
    expect(first.request.createdAt).toBe(CREATED_AT.toISOString());
  });

  it('uses one stable receipt when a competing insert hits the unique account key', async () => {
    write.mockRejectedValue({ code: 11000 });
    expect(await service.requestPublic(INPUT)).toEqual({
      request: {
        id: ACCOUNT_ID,
        status: 'pending',
        createdAt: CREATED_AT.toISOString(),
      },
    });
    expect(model.findById).toHaveBeenCalledWith(new Types.ObjectId(ACCOUNT_ID));
  });

  it('does not hide storage failures or return a false receipt', async () => {
    const error = new Error('storage unavailable');
    write.mockRejectedValue(error);
    await expect(service.requestPublic(INPUT)).rejects.toBe(error);
    write.mockRejectedValue({ code: 11000 });
    read.mockResolvedValue(null);
    await expect(service.requestPublic(INPUT)).rejects.toEqual({ code: 11000 });
    write.mockResolvedValue(null);
    await expect(service.requestPublic(INPUT)).rejects.toThrow(
      'No se pudo registrar',
    );
  });

  it('rejects wrong passwords with a generic error, counts attempts and never writes', async () => {
    compare.mockResolvedValue(false);
    await expect(service.requestPublic(INPUT, '192.0.2.2')).rejects.toThrow(
      'No pudimos verificar tus datos',
    );
    expect(security.registerFailedLogin).toHaveBeenCalledWith(
      'demo@example.test',
      '192.0.2.2',
    );
    expect(security.clearLoginFailures).not.toHaveBeenCalled();
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('also compares a dummy hash for unknown accounts and returns the same generic error', async () => {
    users.findByEmail.mockResolvedValue(null);
    await expect(service.requestPublic(INPUT)).rejects.toThrow(
      'No pudimos verificar tus datos',
    );
    expect(compare).toHaveBeenCalledWith(
      INPUT.password,
      expect.stringMatching(/^\$2b\$12\$/),
    );
    expect(security.registerFailedLogin).toHaveBeenCalled();
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('stops throttled requests before the expensive comparison or storage', async () => {
    security.assertLoginAllowed.mockImplementation(() => {
      throw new HttpException('wait', 429);
    });
    await expect(service.requestPublic(INPUT)).rejects.toBeInstanceOf(
      HttpException,
    );
    expect(users.findByEmail).not.toHaveBeenCalled();
    expect(compare).not.toHaveBeenCalled();
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it.each([
    { confirmation: 'NO' },
    { password: '' },
    { password: 'a'.repeat(129) },
  ])('rejects unsafe body %p even outside the controller', async (override) => {
    await expect(
      service.requestPublic({ ...INPUT, ...override }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(compare).not.toHaveBeenCalled();
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('does not redirect a JWT request to another account with a matching email', async () => {
    users.findByEmail.mockResolvedValue({
      ...account,
      _id: new Types.ObjectId(OTHER_ID),
    });
    await expect(service.requestOwn(ACCOUNT_ID, INPUT)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('rechecks account activity during credential verification', async () => {
    users.findByEmail.mockResolvedValue({
      ...account,
      status: UserStatus.INACTIVE,
    });
    await expect(service.requestOwn(ACCOUNT_ID, INPUT)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('allows an inactive account to request erasure externally without reactivating it', async () => {
    users.findByEmail.mockResolvedValue({
      ...account,
      status: UserStatus.INACTIVE,
    });
    expect((await service.requestPublic(INPUT)).request.status).toBe('pending');
  });

  it('does not let a stale admin JWT bypass actual account role', async () => {
    await expect(service.listPending(ACCOUNT_ID)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(model.find).not.toHaveBeenCalled();
  });

  it('provides a bounded, cursor-based admin queue with no credential data', async () => {
    account.role = UserRole.ADMIN;
    const entries = Array.from({ length: 51 }, (_, index) =>
      entry((index + 1).toString(16).padStart(24, '0')),
    );
    list.exec.mockResolvedValue(entries);
    const result = await service.listPending(ACCOUNT_ID, OTHER_ID);
    expect(model.find).toHaveBeenCalledWith({
      status: 'pending',
      _id: { $gt: new Types.ObjectId(OTHER_ID) },
    });
    expect(list.sort).toHaveBeenCalledWith({ _id: 1 });
    expect(list.limit).toHaveBeenCalledWith(51);
    expect(result.items).toHaveLength(50);
    expect(result.nextCursor).toBe(entries[49]._id.toString());
    expect(Object.keys(result.items[0]).sort()).toEqual([
      'createdAt',
      'email',
      'id',
      'status',
    ]);
  });

  it('rejects invalid admin cursors and returns null email for already removed accounts', async () => {
    account.role = UserRole.ADMIN;
    await expect(service.listPending(ACCOUNT_ID, 'bad')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    list.exec.mockResolvedValue([entry(OTHER_ID)]);
    users.findById.mockResolvedValueOnce(account).mockResolvedValueOnce(null);
    expect(await service.listPending(ACCOUNT_ID)).toEqual({
      items: [
        {
          id: OTHER_ID,
          status: 'pending',
          createdAt: CREATED_AT.toISOString(),
          email: null,
        },
      ],
      nextCursor: null,
    });
  });
});
