import { Script } from 'node:vm';
import { renderAccountDeletionPage } from './public-page';

interface PublicReply {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}
interface PublicOptions {
  method: string;
  credentials: string;
  headers: Record<string, string>;
  body: string;
  signal: AbortSignal;
}

function mountPage() {
  const html = renderAccountDeletionPage('fixture-nonce');
  const source = /<script nonce="[^"]+">([\s\S]+)<\/script>/.exec(html)?.[1];
  if (!source) throw new Error('Missing page script');
  let submitListener:
    | ((event: { preventDefault: () => void }) => Promise<void>)
    | undefined;
  const form = {
    email: { value: ' demo@example.test ' },
    password: { value: 'private-test-value' },
    reportValidity: jest.fn().mockReturnValue(true),
    reset: jest.fn(),
    addEventListener(name: string, listener: typeof submitListener) {
      if (name !== 'submit') throw new Error('Unexpected event');
      submitListener = listener;
    },
  };
  const result = { textContent: '', focus: jest.fn() };
  const button = { textContent: '', disabled: false };
  const elements = { 'deletion-form': form, result, submit: button };
  const fetch = jest.fn<Promise<PublicReply>, [string, PublicOptions]>();
  const clearTimeout = jest.fn();
  const setTimeout = jest.fn().mockReturnValue(1);
  new Script(source).runInNewContext({
    document: {
      getElementById(id: keyof typeof elements) {
        return elements[id];
      },
    },
    window: { location: { pathname: '/api/account-deletion/' } },
    fetch,
    AbortController,
    setTimeout,
    clearTimeout,
  });
  return {
    form,
    result,
    button,
    fetch,
    setTimeout,
    clearTimeout,
    submit() {
      if (!submitListener) throw new Error('Missing submit listener');
      return submitListener({ preventDefault: jest.fn() });
    },
  };
}

function reply(
  status = 201,
  body: unknown = { request: { id: 'fixture-reference', status: 'pending' } },
): PublicReply {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

describe('Public deletion form script (VM and DOM/network fixtures)', () => {
  it('checks browser validity before sending any credentials', async () => {
    const page = mountPage();
    page.form.reportValidity.mockReturnValue(false);
    await page.submit();
    expect(page.fetch).not.toHaveBeenCalled();
    expect(page.button.disabled).toBe(false);
  });

  it('blocks simultaneous submits, omits cookies and clears the password after receipt', async () => {
    const page = mountPage();
    let resolveReply: ((value: PublicReply) => void) | undefined;
    page.fetch.mockImplementation(
      () =>
        new Promise<PublicReply>((resolve) => {
          resolveReply = resolve;
        }),
    );
    const first = page.submit();
    expect(page.button.disabled).toBe(true);
    await page.submit();
    expect(page.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = page.fetch.mock.calls[0];
    expect(url).toBe('/api/account-deletion/requests');
    expect(options.credentials).toBe('omit');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(options.body) as unknown).toEqual({
      email: 'demo@example.test',
      password: 'private-test-value',
      confirmation: 'ELIMINAR',
    });
    if (!resolveReply) throw new Error('No pending request');
    resolveReply(reply());
    await first;
    expect(page.result.textContent).toContain('fixture-reference');
    expect(page.result.textContent).toContain(
      'La cuenta todavía no se ha eliminado',
    );
    expect(page.form.password.value).toBe('');
    expect(page.form.reset).toHaveBeenCalledTimes(1);
    expect(page.button.disabled).toBe(false);
    expect(page.clearTimeout).toHaveBeenCalledWith(1);
    expect(page.result.focus).toHaveBeenCalled();
  });

  it.each([
    [401, 'No pudimos verificar tus datos'],
    [429, 'Hay demasiados intentos'],
    [500, 'No pudimos registrar la solicitud'],
  ])(
    'renders status %s safely and permits a deliberate retry',
    async (status, message) => {
      const page = mountPage();
      page.fetch.mockResolvedValue(reply(status));
      await page.submit();
      expect(page.result.textContent).toContain(message);
      expect(page.result.textContent).not.toContain('Solicitud recibida');
      expect(page.form.password.value).toBe('');
      expect(page.form.email.value).toBe(' demo@example.test ');
      expect(page.form.reset).not.toHaveBeenCalled();
      expect(page.button.disabled).toBe(false);
      expect(page.fetch).toHaveBeenCalledTimes(1);
    },
  );

  it('handles a lost response without retrying or asserting deletion automatically', async () => {
    const page = mountPage();
    page.fetch.mockRejectedValue(new Error('connection lost'));
    await page.submit();
    expect(page.result.textContent).toContain(
      'No pudimos confirmar si se registró',
    );
    expect(page.result.textContent).toContain('una sola solicitud por cuenta');
    expect(page.fetch).toHaveBeenCalledTimes(1);
    expect(page.form.password.value).toBe('');
    expect(page.form.reset).not.toHaveBeenCalled();
    expect(page.button.disabled).toBe(false);
  });

  it('does not treat an unexpected response as a successful receipt', async () => {
    const page = mountPage();
    page.fetch.mockResolvedValue(
      reply(201, { request: { id: 'id', status: 'deleted' } }),
    );
    await page.submit();
    expect(page.result.textContent).toContain(
      'No pudimos confirmar si se registró',
    );
    expect(page.form.reset).not.toHaveBeenCalled();
    expect(page.form.password.value).toBe('');
  });
});
