import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AccountDeletionRequestDocument =
  HydratedDocument<AccountDeletionRequest>;

@Schema({ collection: 'account_deletion_requests', versionKey: false })
export class AccountDeletionRequest {
  // The account ID is also the primary key: concurrent retries cannot create duplicates.
  _id: Types.ObjectId;

  @Prop({ type: String, enum: ['pending'], required: true, default: 'pending' })
  status: 'pending';

  @Prop({ type: Date, required: true })
  createdAt: Date;
}

export const AccountDeletionRequestSchema = SchemaFactory.createForClass(
  AccountDeletionRequest,
);
