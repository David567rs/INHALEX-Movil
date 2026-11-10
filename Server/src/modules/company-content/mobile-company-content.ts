import { MOBILE_COMPANY_CONTENT } from './data/mobile-company-content.generated';

/** Versioned mobile content is independent of the legacy editable web document. */
export function getMobileCompanyContent() {
  return structuredClone(MOBILE_COMPANY_CONTENT);
}

interface PublicDocument {
  readonly title: string;
  readonly updatedAt: string;
  readonly statusLabel: string;
  readonly sections: readonly {
    readonly title: string;
    readonly paragraphs: readonly string[];
  }[];
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const escapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return escapes[character];
  });
}

/** Text only; editorial input cannot introduce executable HTML, links or event handlers. */
export function renderPublicCompanyDocument(document: PublicDocument): string {
  const sections = document.sections
    .map(
      (section) =>
        `<section><h2>${escapeHtml(section.title)}</h2>${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</section>`,
    )
    .join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(document.title)} · INHALEX</title><style>body{margin:0;background:#f7faf4;color:#173c2b;font:1rem/1.7 system-ui,sans-serif}main{max-width:52rem;margin:auto;padding:2rem 1.25rem}h1{line-height:1.2}h2{font-size:1.25rem;margin-top:2rem}p{overflow-wrap:anywhere}.status{display:inline-block;background:#eef1df;padding:.35rem .8rem;border-radius:.5rem}footer{border-top:1px solid #dce5da;margin-top:2rem;padding-top:1rem}</style></head><body><main><p>INHALEX S.A.S. de C.V.</p><h1>${escapeHtml(document.title)}</h1><p class="status">${escapeHtml(document.statusLabel)}</p><p>Última actualización: ${escapeHtml(document.updatedAt)}</p>${sections}<footer>Revisión ${escapeHtml(MOBILE_COMPANY_CONTENT.revision)} · ${escapeHtml(MOBILE_COMPANY_CONTENT.content.contact.email)}</footer></main></body></html>`;
}

export function getPublicCompanyDocument(
  id: 'privacidad' | 'terminos',
): string {
  const document = MOBILE_COMPANY_CONTENT.content.documents.find(
    (entry) => entry.id === id,
  );
  if (!document) throw new Error('Missing packaged legal document');
  return renderPublicCompanyDocument(document);
}
