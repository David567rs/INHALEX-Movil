export type CatalogErrorKind = 'network' | 'timeout' | 'cancelled' | 'server'
  | 'invalid-response' | 'configuration' | 'unknown';

export class CatalogError extends Error {
  readonly kind: CatalogErrorKind;

  constructor(message: string, kind: CatalogErrorKind) {
    super(message);
    this.name = 'CatalogError';
    this.kind = kind;
  }
}
