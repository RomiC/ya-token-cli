import https from 'https';
import { beforeEach, expect, test, vi } from 'vitest';

import { exchange } from '../../lib/token.js';
import { YANDEX_OAUTH_TOKEN_URL } from '../../lib/constants.js';

const CLIENT_ID = '19283j1uh9iasd0120-12klj3h1';
const CLIENT_SECRET = '19283j1uh9iasd0120-12931kj';

vi.mock('https', async () => await import('../__mocks__/https.mock.js'));

beforeEach(() => vi.spyOn(https, 'request'));

test('should return Promise', () => {
  expect(exchange(CLIENT_ID, CLIENT_SECRET, '123123')).toBeInstanceOf(Promise);
});

test('should return token', async () => {
  const exchangePromise = exchange(CLIENT_ID, CLIENT_SECRET, '123123');

  expect(https.request).toHaveBeenCalledWith(
    YANDEX_OAUTH_TOKEN_URL,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': 41
      }
    },
    expect.any(Function)
  );

  expect(https._lastRequest._sentData).toBe('grant_type=authorization_code&code=123123');
  expect(https._lastRequest._isSent).toBe(true);

  https._lastRequest._respondWith(
    200,
    JSON.stringify({
      access_token: '9q8uhfp9q83h4faushdfgioaw349-osaiudhfiasuh',
      expires_in: 31529249,
      refresh_token: 'd09j1f0i8ashjdfahjflakjwefa-wejflakwjeflk',
      token_type: 'bearer'
    })
  );

  await expect(exchangePromise).resolves.toEqual({
    access_token: '9q8uhfp9q83h4faushdfgioaw349-osaiudhfiasuh',
    expires_in: 31529249,
    refresh_token: 'd09j1f0i8ashjdfahjflakjwefa-wejflakwjeflk',
    token_type: 'bearer'
  });
});

test('should reject promise in case of error response', async () => {
  const exchangePromise = exchange(CLIENT_ID, CLIENT_SECRET, '123123');

  https._lastRequest._respondWith(
    401,
    JSON.stringify({
      error: 'invalid_grant',
      error_description: 'Permission were not granted!'
    })
  );

  await expect(exchangePromise).rejects.toThrow('Permission were not granted!');
});
