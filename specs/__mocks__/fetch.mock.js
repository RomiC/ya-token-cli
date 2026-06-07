import { afterEach, beforeEach, mock } from 'node:test';

/**
 * Register beforeEach/afterEach hooks that stub and restore the global fetch.
 * Call once at the top level of each spec file that needs fetch mocking.
 */
export function useFetchMock() {
  beforeEach(() => {
    const queue = [];
    const fetchMock = mock.fn(async () => {
      if (queue.length === 0) throw new Error('Unexpected fetch call: no more mocked responses');
      return queue.shift()();
    });
    fetchMock._queue = queue;
    globalThis.fetch = fetchMock;
  });
  afterEach(() => {
    delete globalThis.fetch;
    mock.restoreAll();
  });
}

/**
 * Configure the global fetch mock with a single response.
 * When called with no arguments, a default 200/null response is set up.
 *
 * @param {{ status?: number, body?: any }} [response]
 */
export function createFetchMock({ status = 200, body = null } = {}) {
  const text = body === null ? 'null' : typeof body === 'string' ? body : JSON.stringify(body);

  fetch._queue.push(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(text),
    text: async () => text
  }));
}
