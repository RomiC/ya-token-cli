import { test } from 'node:test';
import assert from 'node:assert/strict';

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

  assert.ok(exchangePromise instanceof Promise);

  assert.deepStrictEqual(await exchangePromise, tokenData);

  const fetchedOptions = fetch.mock.calls[0].arguments[1];

  assert.strictEqual(fetch.mock.calls[0].arguments[0], YANDEX_OAUTH_TOKEN_URL);
  assert.strictEqual(fetchedOptions.method, 'POST');
  assert.deepStrictEqual(fetchedOptions.headers, {
    Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  });
  assert.deepStrictEqual(
    [...fetchedOptions.body.entries()],
    [
      ['grant_type', 'authorization_code'],
      ['code', '123123']
    ]
  );
});

test('should reject promise in case of error response', async () => {
  createFetchMock({
    status: 401,
    body: { error: 'invalid_grant', error_description: 'Permission were not granted!' }
  });

  await assert.rejects(exchange(CLIENT_ID, CLIENT_SECRET, '123123'), { message: 'Permission were not granted!' });
});
