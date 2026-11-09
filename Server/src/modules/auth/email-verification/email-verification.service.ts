import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import {
  createHmac,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { Model } from 'mongoose';
import { EmailVerificationChallenge } from './email-verification.schema';
import { EmailVerificationRateLimitService } from './email-verification-rate-limit.service';
import {
  REGISTRATION_CODE_SENDER,
  type RegistrationCodeSender,
} from './registration-code-sender';

const CODE_TTL_MINUTES = 10;
const RESEND_DELAY_SECONDS = 60;
const MAX_ATTEMPTS = 5;
const INVALID_CODE =
  'El código es incorrecto, venció o ya se usó. Solicita otro si lo necesitas.';

@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectModel(EmailVerificationChallenge.name)
    private readonly challenges: Model<EmailVerificationChallenge>,
    private readonly config: ConfigService,
    private readonly rateLimit: EmailVerificationRateLimitService,
    @Inject(REGISTRATION_CODE_SENDER)
    private readonly sender: RegistrationCodeSender,
  ) {}

  async issue(rawEmail: string, clientIp: string) {
    const secret = this.getSecret();
    if (!this.sender.available) {
      throw new ServiceUnavailableException(
        'El envío de correo no está disponible.',
      );
    }

    const email = rawEmail.trim().toLowerCase();
    await this.rateLimit.assertSendAllowed(email, clientIp);

    const now = Date.now();
    const expiresAt = new Date(now + CODE_TTL_MINUTES * 60_000);
    const challengeId = randomUUID();
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const _id = this.digest(secret, ['registration-email', email]);
    const codeDigest = this.digest(secret, [
      'registration-code',
      _id,
      challengeId,
      code,
    ]);

    try {
      await this.challenges
        .updateOne(
          { _id, resendAt: { $lte: new Date(now) } },
          {
            $set: {
              challengeId,
              codeDigest,
              remainingAttempts: MAX_ATTEMPTS,
              resendAt: new Date(now + RESEND_DELAY_SECONDS * 1_000),
              expiresAt,
            },
            $unset: { consumedAt: 1 },
          },
          { upsert: true },
        )
        .exec();
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new HttpException(
          'Espera un minuto antes de pedir otro código.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw error;
    }

    try {
      await this.sender.send(email, code, CODE_TTL_MINUTES);
    } catch {
      // Invalidate only this code. A later resend may already have replaced it.
      await this.challenges
        .deleteOne({ _id, challengeId })
        .exec()
        .catch(() => undefined);
      throw new ServiceUnavailableException(
        'No pudimos enviar el código. Inténtalo de nuevo.',
      );
    }

    return {
      challengeId,
      expiresInSeconds: CODE_TTL_MINUTES * 60,
      resendAfterSeconds: RESEND_DELAY_SECONDS,
    };
  }

  async consume(
    rawEmail: string,
    challengeId: string,
    code: string,
  ): Promise<Date> {
    const secret = this.getSecret();
    const email = rawEmail.trim().toLowerCase();
    const _id = this.digest(secret, ['registration-email', email]);
    const filter = { _id, challengeId, consumedAt: { $exists: false } };
    // Reserve an attempt atomically before checking the code. Concurrent guesses
    // cannot all be evaluated against the same remaining attempt.
    const challenge = await this.challenges
      .findOneAndUpdate(
        {
          ...filter,
          expiresAt: { $gt: new Date() },
          remainingAttempts: { $gt: 0 },
        },
        { $inc: { remainingAttempts: -1 } },
      )
      .exec();
    if (!challenge) throw new BadRequestException(INVALID_CODE);

    const candidate = this.digest(secret, [
      'registration-code',
      _id,
      challengeId,
      code,
    ]);
    if (
      !timingSafeEqual(
        Buffer.from(challenge.codeDigest, 'hex'),
        Buffer.from(candidate, 'hex'),
      )
    ) {
      throw new BadRequestException(INVALID_CODE);
    }

    const verifiedAt = new Date();
    const result = await this.challenges
      .updateOne(
        { ...filter, expiresAt: { $gt: verifiedAt } },
        { $set: { consumedAt: verifiedAt } },
      )
      .exec();
    if (result.modifiedCount !== 1) throw new BadRequestException(INVALID_CODE);
    return verifiedAt;
  }

  private getSecret(): string {
    const secret = this.config.get<string>('EMAIL_VERIFICATION_SECRET')?.trim();
    if (!secret || secret.length < 32) {
      throw new ServiceUnavailableException(
        'La verificación de correo no está disponible.',
      );
    }
    return secret;
  }

  private digest(secret: string, fields: string[]): string {
    return createHmac('sha256', secret)
      .update(JSON.stringify(fields))
      .digest('hex');
  }
}
