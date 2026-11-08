import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  Query,
  Req,
  Res,
  UnsupportedMediaTypeException,
  UseGuards,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { UserRole } from '../users/enums/user-role.enum';
import { AccountDeletionService } from './account-deletion.service';
import {
  PublicAccountDeletionDto,
  RequestAccountDeletionDto,
} from './dto/request-account-deletion.dto';
import { renderAccountDeletionPage } from './public-page';

@Controller('account-deletion')
export class AccountDeletionController {
  constructor(private readonly service: AccountDeletionService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Referrer-Policy', 'no-referrer')
  @Header('X-Content-Type-Options', 'nosniff')
  page(@Res({ passthrough: true }) response: Response) {
    const nonce = randomBytes(18).toString('base64');
    response.setHeader(
      'Content-Security-Policy',
      `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'`,
    );
    return renderAccountDeletionPage(nonce);
  }

  @Get('me')
  @Header('Cache-Control', 'private, no-store')
  @UseGuards(JwtAuthGuard)
  getOwn(@Req() request: AuthenticatedRequest) {
    return this.service.getOwn(request.user.sub);
  }

  @Post('me')
  @Header('Cache-Control', 'private, no-store')
  @UseGuards(JwtAuthGuard)
  requestOwn(
    @Req() request: AuthenticatedRequest,
    @Body() input: RequestAccountDeletionDto,
  ) {
    this.requireJson(request);
    return this.service.requestOwn(request.user.sub, input, request.ip);
  }

  @Post('requests')
  @Header('Cache-Control', 'private, no-store')
  requestPublic(
    @Req() request: Request,
    @Body() input: PublicAccountDeletionDto,
  ) {
    this.requireJson(request);
    // Use Express's IP handling; never trust an arbitrary X-Forwarded-For header here.
    return this.service.requestPublic(input, request.ip);
  }

  private requireJson(request: Request) {
    if (!request.is('application/json'))
      throw new UnsupportedMediaTypeException('Utiliza application/json.');
  }
}

@Controller('admin/account-deletion')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminAccountDeletionController {
  constructor(private readonly service: AccountDeletionService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  list(@Req() request: AuthenticatedRequest, @Query('cursor') cursor?: string) {
    return this.service.listPending(request.user.sub, cursor);
  }
}
