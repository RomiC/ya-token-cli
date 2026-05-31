import { mock } from 'node:test';
import { beforeEach, expect, test } from 'vitest';

import { exchange } from '../lib/token.js';
import { YANDEX_OAUTH_TOKEN_URL } from '../lib/constants.js';

const CLIENT_ID = '19283j1uh9iasd0120-12klj3h1';
const CLIENT_SECRET = '19283j1uh9iasd0120-12931kj';

const TOKEN_DATA = {
  access_token: '9q8uhfp9q83h4faushdfgioaw349-osaiudhfiasuh',
  expires_in: 31529249,
  refresh_token: 'd09j1f0i8ashjdfahjflakjwefa-wejflakwjeflk',
  token_type: 'bearer'
};

let fetchMock;

beforeEach(() => {
  mock.restoreAll();
  fetchMock = mock.method(globalThis, 'fetch', async () => ({
    status: 200,
    text: async () => JSON.stringify(TOKEN_DATA)
  }));
});

test('should return Promise', () => {
  expect(exchange(CLIENT_ID, CLIENT_SECRET, '123123')).toBeInstanceOf(Promise);
});

test('should return token', async () => {
  const exchangePromise = exchange(CLIENT_ID, CLIENT_SECRET, '123123');

  expect(fetchMock.mock.calls[0].arguments[0]).toBe(YANDEX_OAUTH_TOKEN_URL);
  expect(fetchMock.mock.calls[0].arguments[1]).toMatchObject({
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: expect.any(URLSearchParams)
  });
  expect(fetchMock.mock.calls[0].arguments[1].headers['Content-Length']).toBeUndefined();
  expect(fetchMock.mock.calls[0].arguments[1].body.toString()).toBe('grant_type=authorization_code&code=123123');

  await expect(exchangePromise).resolves.toEqual(TOKEN_DATA);
});

test('should reject promise in case of error response', async () => {
  mock.restoreAll();
  mock.method(globalThis, 'fetch', async () => ({
    status: 401,
    text: async () =>
      JSON.stringify({
        error: 'invalid_grant',
        error_description: 'Permission were not granted!'
      })
  }));
  const exchangePromise = exchange(CLIENT_ID, CLIENT_SECRET, '123123');

  await expect(exchangePromise).rejects.toThrow('Permission were not granted!');
});
