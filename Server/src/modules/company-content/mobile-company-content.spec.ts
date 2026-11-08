import 'reflect-metadata';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { CompanyContentController } from './company-content.controller';
import { CompanyContentService } from './company-content.service';
import { MOBILE_COMPANY_CONTENT } from './data/mobile-company-content.generated';
import {
  getMobileCompanyContent,
  getPublicCompanyDocument,
  renderPublicCompanyDocument,
} from './mobile-company-content';

describe('Public mobile company content', () => {
  it('serves the versioned reviewed shape without touching the legacy database service', () => {
    const service = { getPublicContent: jest.fn() };
    const controller = new CompanyContentController(
      service as unknown as CompanyContentService,
    );
    const result = controller.getMobileContent();
    expect(result.schemaVersion).toBe(1);
    expect(result).toEqual(MOBILE_COMPANY_CONTENT);
    expect(result.content.company.activity).toBeTruthy();
    expect(result.content.company.innovation.benefits).toHaveLength(3);
    expect(result.content.contact.phoneUri).toBe('tel:+527712034573');
    controller.getPrivacyPolicy();
    controller.getTermsAndConditions();
    expect(service.getPublicContent).not.toHaveBeenCalled();
    expect(
      Reflect.getMetadata(GUARDS_METADATA, CompanyContentController),
    ).toBeUndefined();
    expect(
      Reflect.getMetadata(PATH_METADATA, controller.getMobileContent),
    ).toBe('mobile');
  });

  it('keeps the legacy public route delegated to its original service', () => {
    const legacy = { about: { mission: 'Legacy web content' } };
    const service = { getPublicContent: jest.fn().mockReturnValue(legacy) };
    const controller = new CompanyContentController(
      service as unknown as CompanyContentService,
    );
    expect(controller.getPublicContent()).toBe(legacy);
    expect(service.getPublicContent).toHaveBeenCalledTimes(1);
  });

  it('returns independent snapshots so a consumer cannot alter the canonical content', () => {
    const first = getMobileCompanyContent();
    expect(first).not.toBe(MOBILE_COMPANY_CONTENT);
    expect(first.content.documents).not.toBe(
      MOBILE_COMPANY_CONTENT.content.documents,
    );
  });

  it.each(['privacidad', 'terminos'] as const)(
    'renders every %s section and retains its draft status',
    (id) => {
      const source = MOBILE_COMPANY_CONTENT.content.documents.find(
        (entry) => entry.id === id,
      )!;
      const html = getPublicCompanyDocument(id);
      expect(html).toContain('<html lang="es">');
      expect(html).toContain(source.statusLabel);
      expect(html).toContain(source.updatedAt);
      expect(html.match(/<section>/g)).toHaveLength(source.sections.length);
      expect(html).not.toContain('<script');
      expect(html).not.toContain('https://');
    },
  );

  it('escapes hostile editorial text as readable text in all document fields', () => {
    const html = renderPublicCompanyDocument({
      title: '<script>alert("x")</script>',
      statusLabel: '<img src=x onerror=alert(1)>',
      updatedAt: '" & <date>',
      sections: [
        {
          title: '<h1>injected</h1>',
          paragraphs: ['<iframe src="evil"></iframe>', "O'Connor & compañía"],
        },
      ],
    });
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<iframe');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('O&#39;Connor &amp; compañía');
  });
});
