import { expect, test } from 'vitest';

import { useFetchMock, createFetchMock } from './__mocks__/fetch.mock.js';
import { exchange } from '../lib/token.js';
import { YANDEX_OAUTH_TOKEN_URL } from '../lib/constants.js';

const CLIENT_ID = '19283j1uh9iasd0120-12klj3h1';
const CLIENT_SECRET = '19283j1uh9iasd0120-12931kj';

useFetchMock();

test('should call the token endpoint and return the token', async () => {
  const tokenData = {
    access_token: 'api-token-created-and-used-for-test-purposes-only',
    expires_in: 31529249,
    refresh_token: 'api-token-created-and-used-for-test-purposes-only',
    token_type: 'bearer'
  };

  createFetchMock({ body: tokenData });

  const exchangePromise = exchange(CLIENT_ID, CLIENT_SECRET, '123123');

  expect(exchangePromise).toBeInstanceOf(Promise);

  await expect(exchangePromise).resolves.toEqual(tokenData);

  expect(fetch).toHaveBeenCalledWith(YANDEX_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code: '123123' })
  });
});

test('should reject promise in case of error response', async () => {
  createFetchMock({
    status: 401,
    body: { error: 'invalid_grant', error_description: 'Permission were not granted!' }
  });

  await expect(exchange(CLIENT_ID, CLIENT_SECRET, '123123')).rejects.toThrow('Permission were not granted!');
});
