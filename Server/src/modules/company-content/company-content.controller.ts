import { Controller, Get, Header } from '@nestjs/common';
import { CompanyContentService } from './company-content.service';
import {
  getMobileCompanyContent,
  getPublicCompanyDocument,
} from './mobile-company-content';

@Controller('company-content')
export class CompanyContentController {
  constructor(private readonly companyContentService: CompanyContentService) {}

  @Get('mobile')
  @Header('Cache-Control', 'no-cache')
  getMobileContent(this: void) {
    return getMobileCompanyContent();
  }

  @Get('privacy')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-cache')
  @Header('X-Content-Type-Options', 'nosniff')
  @Header(
    'Content-Security-Policy',
    "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
  )
  getPrivacyPolicy() {
    return getPublicCompanyDocument('privacidad');
  }

  @Get('terms')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-cache')
  @Header('X-Content-Type-Options', 'nosniff')
  @Header(
    'Content-Security-Policy',
    "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
  )
  getTermsAndConditions() {
    return getPublicCompanyDocument('terminos');
  }

  @Get()
  getPublicContent() {
    return this.companyContentService.getPublicContent();
  }
}
