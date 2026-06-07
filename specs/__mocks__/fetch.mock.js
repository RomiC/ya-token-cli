import { afterEach, beforeEach, vi } from 'vitest';

/**
 * Register beforeEach/afterEach hooks that stub and restore the global fetch.
 * Call once at the top level of each spec file that needs fetch mocking.
 */
export function useFetchMock() {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
  afterEach(() => vi.unstubAllGlobals());
}

/**
 * Configure the global fetch mock with a single response.
 * When called with no arguments, a default 200/null response is set up.
 *
 * @param {{ status?: number, body?: any }} [response]
 */
export function createFetchMock({ status = 200, body = null } = {}) {
  const text = body === null ? 'null' : typeof body === 'string' ? body : JSON.stringify(body);

  fetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(text),
    text: async () => text
  });
}
