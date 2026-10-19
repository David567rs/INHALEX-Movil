export type FavoritesErrorKind = 'unauthorized' | 'network' | 'timeout' | 'cancelled'
  | 'invalid-response' | 'invalid-request' | 'not-found' | 'configuration' | 'server';

export class FavoritesError extends Error {
  readonly kind: FavoritesErrorKind;

  constructor(message: string, kind: FavoritesErrorKind) {
    super(message);
    this.name = 'FavoritesError';
    this.kind = kind;
  }
}
