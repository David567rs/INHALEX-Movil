import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { AuthSecurityService } from '../auth/auth-security.service';
import { UserRole } from '../users/enums/user-role.enum';
import { UserStatus } from '../users/enums/user-status.enum';
import { UsersService } from '../users/users.service';
import {
  RequestAccountDeletionDto,
  PublicAccountDeletionDto,
} from './dto/request-account-deletion.dto';
import {
  AccountDeletionRequest,
  AccountDeletionRequestDocument,
} from './schemas/account-deletion-request.schema';

const DUMMY_PASSWORD_HASH =
  '$2b$12$g6aAoKE.LQsFX7.CrRJpee/AwoBD8bzjePFtDWK0zJh0JV6D9VD1i';
const INVALID_CREDENTIALS =
  'No pudimos verificar tus datos. Revisa el correo y la contraseña.';

export interface AccountDeletionReceipt {
  id: string;
  status: 'pending';
  createdAt: string;
}

@Injectable()
export class AccountDeletionService {
  constructor(
    @InjectModel(AccountDeletionRequest.name)
    private readonly requests: Model<AccountDeletionRequestDocument>,
    private readonly users: UsersService,
    private readonly security: AuthSecurityService,
  ) {}

  async getOwn(
    userId: string,
  ): Promise<{ request: AccountDeletionReceipt | null }> {
    await this.requireActiveAccount(userId);
    const request = await this.requests.findById(userId).exec();
    return { request: request ? this.receipt(request) : null };
  }

  async requestOwn(
    userId: string,
    input: RequestAccountDeletionDto,
    ip?: string,
  ) {
    const account = await this.requireActiveAccount(userId);
    return this.requestPublic({ ...input, email: account.email }, ip, userId);
  }

  async requestPublic(
    input: PublicAccountDeletionDto,
    ip?: string,
    expectedId?: string,
  ) {
    this.validateInput(input);
    const email = input.email.trim().toLowerCase();
    this.security.assertLoginAllowed(email, ip);
    const user = await this.users.findByEmail(email, true);
    const valid = await bcrypt.compare(
      input.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );
    if (
      !user ||
      !valid ||
      (expectedId &&
        (user._id.toString() !== expectedId ||
          user.status !== UserStatus.ACTIVE))
    ) {
      this.security.registerFailedLogin(email, ip);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    // An inactive account may still request deletion externally. This does not reactivate it.
    this.security.clearLoginFailures(email, ip);
    const accountId = new Types.ObjectId(user._id.toString());
    let request: AccountDeletionRequestDocument | null;
    try {
      request = await this.requests
        .findOneAndUpdate(
          { _id: accountId },
          { $setOnInsert: { status: 'pending', createdAt: new Date() } },
          {
            upsert: true,
            returnDocument: 'after',
            runValidators: true,
            setDefaultsOnInsert: true,
          },
        )
        .exec();
    } catch (error: unknown) {
      if (
        typeof error !== 'object' ||
        error === null ||
        !('code' in error) ||
        error.code !== 11000
      )
        throw error;
      request = await this.requests.findById(accountId).exec();
      if (!request) throw error;
    }
    if (!request)
      throw new Error('No se pudo registrar la solicitud de eliminación.');
    return { request: this.receipt(request) };
  }

  async listPending(adminId: string, cursor?: string) {
    const admin = await this.requireActiveAccount(adminId);
    if (admin.role !== UserRole.ADMIN) throw new ForbiddenException();
    if (cursor && !/^[a-f\d]{24}$/i.test(cursor))
      throw new BadRequestException('Cursor inválido');
    const entries = await this.requests
      .find({
        status: 'pending',
        ...(cursor ? { _id: { $gt: new Types.ObjectId(cursor) } } : {}),
      })
      .sort({ _id: 1 })
      .limit(51)
      .exec();
    const page = entries.slice(0, 50);
    const items = await Promise.all(
      page.map(async (entry) => {
        const user = await this.users.findById(entry._id.toString());
        return { ...this.receipt(entry), email: user?.email ?? null };
      }),
    );
    return {
      items,
      nextCursor: entries.length > 50 ? page[49]._id.toString() : null,
    };
  }

  private async requireActiveAccount(userId: string) {
    if (!/^[a-f\d]{24}$/i.test(userId))
      throw new UnauthorizedException('La sesión no es válida');
    const user = await this.users.findById(userId);
    if (!user || user.status !== UserStatus.ACTIVE)
      throw new UnauthorizedException('La cuenta no está disponible');
    return user;
  }

  private validateInput(input: PublicAccountDeletionDto) {
    if (
      input.confirmation !== 'ELIMINAR' ||
      typeof input.password !== 'string' ||
      input.password.length < 1 ||
      input.password.length > 128 ||
      typeof input.email !== 'string' ||
      input.email.length > 254
    ) {
      throw new BadRequestException(
        'Confirma que deseas solicitar la eliminación de tu cuenta.',
      );
    }
  }

  private receipt(request: AccountDeletionRequest): AccountDeletionReceipt {
    return {
      id: request._id.toString(),
      status: request.status,
      createdAt: request.createdAt.toISOString(),
    };
  }
}
