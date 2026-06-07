import { expect, test } from 'vitest';

import { useFetchMock, createFetchMock } from './__mocks__/fetch.mock.js';
import { CLCK_API_URL } from '../lib/constants.js';
import { shortenUrl } from '../lib/clck.js';

useFetchMock();

test('should shorten url, using clck.ru service', async () => {
  const urlToShorten = 'https://my-very-long-url.com/?with_a_long=param';

  createFetchMock({ body: 'https://clck.ru/38hj' });

  const result = await shortenUrl(urlToShorten);

  expect(fetch).toHaveBeenCalledWith(`${CLCK_API_URL}?${new URLSearchParams({ url: urlToShorten })}`, {
    method: 'GET',
    headers: {},
    body: null
  });
  expect(result).toBe('https://clck.ru/38hj');
});
