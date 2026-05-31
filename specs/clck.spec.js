import { mock } from 'node:test';
import querystring from 'node:querystring';
import { expect, test } from 'vitest';

import { CLCK_API_URL } from '../lib/constants.js';
import { shortenUrl } from '../lib/clck.js';

test('should short url, using clck.ru service', () => {
  mock.restoreAll();
  const fetchMock = mock.method(globalThis, 'fetch', async () => ({
    status: 200,
    text: async () => 'https://clck.ru/38hj'
  }));

  const urlToShorten = 'https://my-very-long-url.com/?with_a_long=param';
  const shortUrlPromise = shortenUrl(urlToShorten);

  expect(shortUrlPromise).toBeInstanceOf(Promise);
  expect(fetchMock.mock.calls[0].arguments[0]).toBe(`${CLCK_API_URL}?url=${querystring.escape(urlToShorten)}`);
  expect(fetchMock.mock.calls[0].arguments[1]).toEqual({
    method: 'GET',
    headers: {}
  });

  expect(shortUrlPromise).resolves.toBe('https://clck.ru/38hj');
});
