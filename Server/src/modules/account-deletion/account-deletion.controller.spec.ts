import {
  ExecutionContext,
  HttpException,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import { Script } from 'node:vm';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { UserRole } from '../users/enums/user-role.enum';
import {
  AccountDeletionController,
  AdminAccountDeletionController,
} from './account-deletion.controller';
import { AccountDeletionService } from './account-deletion.service';

const ACCOUNT_ID = '507f1f77bcf86cd799439011';
const receipt = {
  id: ACCOUNT_ID,
  status: 'pending',
  createdAt: '2026-11-08T12:00:00.000Z',
};

describe('Account deletion HTTP boundary (isolated service and identity fixtures)', () => {
  let app: INestApplication;
  let server: Server;
  const service = {
    getOwn: jest.fn(),
    requestOwn: jest.fn(),
    requestPublic: jest.fn(),
    listPending: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AccountDeletionController, AdminAccountDeletionController],
      providers: [{ provide: AccountDeletionService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
          const token = req.headers.authorization;
          if (
            token !== 'Bearer fixture-user' &&
            token !== 'Bearer fixture-admin'
          )
            throw new UnauthorizedException();
          req.user = {
            sub: ACCOUNT_ID,
            email: 'demo@example.test',
            role:
              token === 'Bearer fixture-admin' ? UserRole.ADMIN : UserRole.USER,
          };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    server = app.getHttpServer() as Server;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    service.getOwn.mockResolvedValue({ request: null });
    service.requestOwn.mockResolvedValue({ request: receipt });
    service.requestPublic.mockResolvedValue({ request: receipt });
    service.listPending.mockResolvedValue({ items: [], nextCursor: null });
  });
  afterAll(async () => {
    await app.close();
  });

  it('requires authentication on personal and admin data', async () => {
    await request(server).get('/api/account-deletion/me').expect(401);
    await request(server)
      .post('/api/account-deletion/me')
      .send({ password: 'test', confirmation: 'ELIMINAR' })
      .expect(401);
    await request(server).get('/api/admin/account-deletion').expect(401);
    expect(service.getOwn).not.toHaveBeenCalled();
    expect(service.requestOwn).not.toHaveBeenCalled();
    expect(service.listPending).not.toHaveBeenCalled();
  });

  it('uses the JWT subject and disallows choosing somebody else through body fields', async () => {
    const response = await request(server)
      .get('/api/account-deletion/me')
      .set('Authorization', 'Bearer fixture-user')
      .expect(200);
    expect(response.body).toEqual({ request: null });
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(service.getOwn).toHaveBeenCalledWith(ACCOUNT_ID);
    await request(server)
      .post('/api/account-deletion/me')
      .set('Authorization', 'Bearer fixture-user')
      .send({ password: 'test', confirmation: 'ELIMINAR', userId: 'another' })
      .expect(400);
    expect(service.requestOwn).not.toHaveBeenCalled();
  });

  it('rejects missing consent, malformed email and oversized password before service writes', async () => {
    await request(server)
      .post('/api/account-deletion/requests')
      .send({ email: 'bad', password: 'test', confirmation: 'ELIMINAR' })
      .expect(400);
    await request(server)
      .post('/api/account-deletion/requests')
      .send({ email: 'demo@example.test', password: 'test' })
      .expect(400);
    await request(server)
      .post('/api/account-deletion/me')
      .set('Authorization', 'Bearer fixture-user')
      .send({ password: 'p'.repeat(129), confirmation: 'ELIMINAR' })
      .expect(400);
    expect(service.requestPublic).not.toHaveBeenCalled();
    expect(service.requestOwn).not.toHaveBeenCalled();
  });

  it('rejects cross-site simple form posts even when credentials are present', async () => {
    await request(server)
      .post('/api/account-deletion/requests')
      .type('form')
      .send({
        email: 'demo@example.test',
        password: 'test',
        confirmation: 'ELIMINAR',
      })
      .expect(415);
    await request(server)
      .post('/api/account-deletion/me')
      .set('Authorization', 'Bearer fixture-user')
      .type('form')
      .send({ password: 'test', confirmation: 'ELIMINAR' })
      .expect(415);
    expect(service.requestPublic).not.toHaveBeenCalled();
    expect(service.requestOwn).not.toHaveBeenCalled();
  });

  it('accepts external reauthentication without cookies or a sign-in token', async () => {
    const input = {
      email: 'demo@example.test',
      password: 'test',
      confirmation: 'ELIMINAR',
    };
    const response = await request(server)
      .post('/api/account-deletion/requests')
      .set('X-Forwarded-For', 'forged-ip')
      .send(input)
      .expect(201);
    expect(response.body).toEqual({ request: receipt });
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(service.requestPublic).toHaveBeenCalledWith(
      input,
      expect.any(String),
    );
    const calls = service.requestPublic.mock.calls as unknown[][];
    expect(calls[0][1]).not.toBe('forged-ip');
    expect(response.headers['cache-control']).toBe('private, no-store');
  });

  it('allows only admins into the queue and forwards the cursor', async () => {
    await request(server)
      .get('/api/admin/account-deletion')
      .set('Authorization', 'Bearer fixture-user')
      .expect(403);
    expect(service.listPending).not.toHaveBeenCalled();
    await request(server)
      .get(`/api/admin/account-deletion?cursor=${ACCOUNT_ID}`)
      .set('Authorization', 'Bearer fixture-admin')
      .expect(200);
    expect(service.listPending).toHaveBeenCalledWith(ACCOUNT_ID, ACCOUNT_ID);
  });

  it('returns the personal receipt using only the authenticated subject', async () => {
    const input = { password: 'test', confirmation: 'ELIMINAR' };
    const response = await request(server)
      .post('/api/account-deletion/me')
      .set('Authorization', 'Bearer fixture-user')
      .send(input)
      .expect(201);
    expect(response.body).toEqual({ request: receipt });
    expect(service.requestOwn).toHaveBeenCalledWith(
      ACCOUNT_ID,
      input,
      expect.any(String),
    );
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('preserves reauthentication and rate-limit error statuses without echoing credentials', async () => {
    const input = {
      email: 'demo@example.test',
      password: 'private-test-value',
      confirmation: 'ELIMINAR',
    };
    service.requestPublic.mockRejectedValueOnce(
      new UnauthorizedException('No pudimos verificar tus datos.'),
    );
    const unauthorized = await request(server)
      .post('/api/account-deletion/requests')
      .send(input)
      .expect(401);
    expect(unauthorized.text).not.toContain(input.password);
    expect(unauthorized.headers['set-cookie']).toBeUndefined();
    service.requestOwn.mockRejectedValueOnce(
      new HttpException('Demasiados intentos', 429),
    );
    const throttled = await request(server)
      .post('/api/account-deletion/me')
      .set('Authorization', 'Bearer fixture-user')
      .send({ password: input.password, confirmation: 'ELIMINAR' })
      .expect(429);
    expect(throttled.text).not.toContain(input.password);
  });

  it('serves an accessible public page with a fresh nonce and no account data', async () => {
    const first = await request(server)
      .get('/api/account-deletion')
      .expect(200);
    const second = await request(server)
      .get('/api/account-deletion')
      .expect(200);
    expect(first.headers['content-type']).toContain('text/html');
    expect(first.headers['cache-control']).toBe('private, no-store');
    expect(first.headers['referrer-policy']).toBe('no-referrer');
    expect(first.headers['x-content-type-options']).toBe('nosniff');
    const csp = String(first.headers['content-security-policy']);
    const nonce = /script-src 'nonce-([^']+)'/.exec(csp)?.[1];
    expect(nonce).toBeTruthy();
    expect(first.text).toContain(`<script nonce="${nonce}">`);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(second.headers['content-security-policy']).not.toEqual(csp);
    expect(first.text).toContain('role="status"');
    expect(first.text).toContain('¿No puedes entrar a tu cuenta?');
    expect(first.text).toContain('danielcruzhernandezinhalex@gmail.com');
    expect(first.text).toContain(
      'Recibir la solicitud no significa que la cuenta ya fue eliminada',
    );
    expect(first.text).not.toContain('localStorage');
    expect(first.text).not.toContain('innerHTML');
    const script = /<script nonce="[^"]+">([\s\S]+)<\/script>/.exec(
      first.text,
    )?.[1];
    expect(script).toBeTruthy();
    expect(() => new Script(script as string)).not.toThrow();
    expect(service.getOwn).not.toHaveBeenCalled();
  });
});
