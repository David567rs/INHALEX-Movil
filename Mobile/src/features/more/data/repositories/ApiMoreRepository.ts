import type { HttpClient } from '../../../../core/network/HttpClient';
import type { MoreContentResult } from '../../domain/models/MoreContentResult';
import type { MoreRepository } from '../../domain/repositories/MoreRepository';
import { compareMoreRevision, mapMoreContent } from '../mappers/mapMoreContent';
import { LocalMoreRepository } from './LocalMoreRepository';

/** Public, read-only content. A failure never replaces previously verified content. */
export class ApiMoreRepository implements MoreRepository {
  private lastGood: MoreContentResult | null = null;
  private pending: Promise<MoreContentResult> | null = null;

  constructor(private readonly getClient: () => Pick<HttpClient, 'request'>,
    private readonly bundled: MoreRepository = new LocalMoreRepository()) {}

  getContent(): Promise<MoreContentResult> {
    if (!this.pending) {
      this.pending = this.load().finally(() => { this.pending = null; });
    }
    return this.pending;
  }

  private async load(): Promise<MoreContentResult> {
    try {
      const payload = await this.getClient().request('/company-content/mobile', { method: 'GET', authenticated: false });
      const mapped = mapMoreContent(payload);
      if (this.lastGood && compareMoreRevision(mapped.revision, this.lastGood.revision) < 0) throw new Error('Older revision');
      this.lastGood = Object.freeze({ ...mapped, source: 'remote', warning: null });
      return this.lastGood;
    } catch {
      const saved = this.lastGood ?? await this.bundled.getContent();
      return Object.freeze({ ...saved, source: this.lastGood ? 'memory' : 'bundled',
        warning: this.lastGood
          ? 'No pudimos actualizar la información. Conservamos la última versión consultada. Inténtalo de nuevo.'
          : 'No pudimos consultar la información actualizada. Mostramos la versión incluida en la app. Inténtalo de nuevo.' });
    }
  }
}
