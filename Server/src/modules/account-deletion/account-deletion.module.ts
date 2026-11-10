import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import {
  AccountDeletionController,
  AdminAccountDeletionController,
} from './account-deletion.controller';
import { AccountDeletionService } from './account-deletion.service';
import {
  AccountDeletionRequest,
  AccountDeletionRequestSchema,
} from './schemas/account-deletion-request.schema';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MongooseModule.forFeature([
      {
        name: AccountDeletionRequest.name,
        schema: AccountDeletionRequestSchema,
      },
    ]),
  ],
  controllers: [AccountDeletionController, AdminAccountDeletionController],
  providers: [AccountDeletionService],
})
export class AccountDeletionModule {}
