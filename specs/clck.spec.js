import { test } from 'node:test';
import assert from 'node:assert/strict';

import { useFetchMock, createFetchMock } from './__mocks__/fetch.mock.js';
import { CLCK_API_URL } from '../lib/constants.js';
import { shortenUrl } from '../lib/clck.js';

useFetchMock();

test('should shorten url, using clck.ru service', async () => {
  const urlToShorten = 'https://my-very-long-url.com/?with_a_long=param';

  createFetchMock({ body: 'https://clck.ru/38hj' });

  const result = await shortenUrl(urlToShorten);

  assert.deepStrictEqual(fetch.mock.calls[0].arguments, [
    `${CLCK_API_URL}?${new URLSearchParams({ url: urlToShorten })}`,
    { method: 'GET', headers: {}, body: null }
  ]);
  assert.strictEqual(result, 'https://clck.ru/38hj');
});
