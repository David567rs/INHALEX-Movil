import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHash } from 'node:crypto';
import { Model } from 'mongoose';
import { EmailVerificationRateLimitBucket } from './email-verification-rate-limit.schema';

const SEND_WINDOW_MS = 60 * 60 * 1000;
const SENDS_PER_EMAIL = 5;
const SENDS_PER_IP = 30;

@Injectable()
export class EmailVerificationRateLimitService {
  constructor(
    @InjectModel(EmailVerificationRateLimitBucket.name)
    private readonly buckets: Model<EmailVerificationRateLimitBucket>,
  ) {}

  async assertSendAllowed(email: string, clientIp: string): Promise<void> {
    const now = new Date();
    const ip = clientIp
      .trim()
      .toLowerCase()
      .replace(/^::ffff:/, '');
    // An exhausted origin cannot spend a recipient's quota.
    await this.reserve('ip', ip, SENDS_PER_IP, now);
    await this.reserve(
      'email',
      email.trim().toLowerCase(),
      SENDS_PER_EMAIL,
      now,
    );
  }

  private async reserve(
    scope: 'ip' | 'email',
    value: string,
    limit: number,
    now: Date,
  ): Promise<void> {
    const _id = createHash('sha256').update(`${scope}:${value}`).digest('hex');
    const activeBucket = {
      _id,
      expiresAt: { $gt: now },
      count: { $lt: limit },
    };
    const increment = { $inc: { count: 1 } };
    const incremented = await this.buckets
      .updateOne(activeBucket, increment)
      .exec();
    if (incremented.matchedCount === 1) return;

    // A missing or expired bucket starts a new window on its first request.
    // A concurrent insert or an active full bucket can collide on the same ID.
    try {
      const started = await this.buckets
        .updateOne(
          { _id, expiresAt: { $lte: now } },
          {
            $set: {
              count: 1,
              expiresAt: new Date(now.getTime() + SEND_WINDOW_MS),
            },
          },
          { upsert: true },
        )
        .exec();
      if (started.matchedCount === 1 || started.upsertedCount === 1) return;
      throw new Error('Could not reserve an email verification quota.');
    } catch (error: unknown) {
      if (
        !error ||
        typeof error !== 'object' ||
        !('code' in error) ||
        error.code !== 11000
      ) {
        throw error;
      }
    }

    const retried = await this.buckets
      .updateOne(activeBucket, increment)
      .exec();
    if (retried.matchedCount === 1) return;
    throw new HttpException(
      'Demasiadas solicitudes de código. Espera antes de volver a intentarlo.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
