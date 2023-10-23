import https from 'node:https';
import querystring from 'node:querystring';
import { expect, test, vi } from 'vitest';

import { CLCK_API_URL } from '../../lib/constants.js';
import { shortenUrl } from '../../lib/clck.js';

vi.mock('https', async () => await import('../__mocks__/https.mock.js'));

test('should short url, using clck.ru service', () => {
  const urlToShorten = 'https://my-very-long-url.com/?with_a_long=param';
  const shortUrlPromise = shortenUrl(urlToShorten);

  expect(shortUrlPromise).toBeInstanceOf(Promise);

  const { _lastRequest } = https;

  expect(_lastRequest._context.url).toBe(`${CLCK_API_URL}?url=${querystring.escape(urlToShorten)}`);

  https._lastRequest._respondWith(200, 'https://clck.ru/38hj');

  expect(shortUrlPromise).resolves.toBe('https://clck.ru/38hj');
});
