import * as dotenv from 'dotenv';
dotenv.config();

import http from 'node:http';
import readline from 'node:readline/promises';
import { beforeEach, expect, test, vi } from 'vitest';

import { useFetchMock, createFetchMock } from './__mocks__/fetch.mock.js';
import { CLCK_API_URL, YANDEX_OAUTH_TOKEN_URL } from '../lib/constants.js';
import { auth } from '../index.js';

const { YANDEX_CLIENT_ID, YANDEX_CLIENT_SECRET } = process.env;

vi.mock('node:readline/promises', async () => await import('../specs/__mocks__/readline.mock.js'));

useFetchMock();

beforeEach(() => {
  vi.spyOn(process.stdout, 'write');
  readline._resetMock();
});

test('should obtain token automatically via redirect', async () => {
  const tokenData = {
    access_token: 'api-token-created-and-used-for-test-purposes-only',
    expires_in: 31500508,
    refresh_token: 'api-token-created-and-used-for-test-purposes-only',
    token_type: 'bearer'
  };

  createFetchMock({ body: 'https://clck.ru/3498ab' }); // clck.ru shortener
  createFetchMock({ body: tokenData }); // Yandex OAuth token exchange

  const tokenPromise = auth(YANDEX_CLIENT_ID, YANDEX_CLIENT_SECRET, { redirectURI: 'http://localhost:9999' });

  expect(tokenPromise).toBeInstanceOf(Promise);
  expect(fetch).toHaveBeenCalledWith(expect.stringMatching(CLCK_API_URL), expect.any(Object));

  // Wait for the clck.ru response to process and the redirect server to start
  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(process.stdout.write).toHaveBeenCalledWith(expect.stringMatching('Visit https://clck.ru/3498ab'));
  expect(process.stdout.write).toHaveBeenCalledWith(expect.stringContaining('Server listening on port 9999'));

  // Simulate Yandex OAuth redirect with the confirmation code
  await new Promise((resolve, reject) => {
    const req = http.request('http://localhost:9999/?code=123456', (response) =>
      response.statusCode === 200 ? resolve() : reject(response.statusCode)
    );
    req.end();
  });

  // Wait for the full token exchange to complete, then assert both fetch calls
  await expect(tokenPromise).resolves.toEqual(tokenData);

  expect(fetch).toHaveBeenNthCalledWith(
    2,
    YANDEX_OAUTH_TOKEN_URL,
    expect.objectContaining({
      body: new URLSearchParams({ grant_type: 'authorization_code', code: '123456' })
    })
  );
});

test('should obtain token requesting confirmation code from the user', async () => {
  const tokenData = {
    access_token: 'api-token-created-and-used-for-test-purposes-only',
    expires_in: 31500508,
    refresh_token: 'api-token-created-and-used-for-test-purposes-only',
    token_type: 'bearer'
  };

  createFetchMock({ body: 'https://clck.ru/3498ff' }); // clck.ru shortener
  createFetchMock({ body: tokenData }); // Yandex OAuth token exchange

  const tokenPromise = auth(YANDEX_CLIENT_ID, YANDEX_CLIENT_SECRET, {}, true, false);

  expect(tokenPromise).toBeInstanceOf(Promise);
  expect(fetch).toHaveBeenCalledWith(expect.stringMatching(CLCK_API_URL), expect.any(Object));

  // Wait for the clck.ru response to process and the readline question to appear
  await new Promise(process.nextTick);

  expect(process.stdout.write).toHaveBeenCalledWith(expect.stringMatching('Visit https://clck.ru/3498ff'));

  const readlineQuestion = readline._lastInterface._lastQuestion;
  expect(readlineQuestion._title).toBe('Enter confirmation code: ');

  readlineQuestion._answer('654321');

  // Wait for the full token exchange to complete, then assert both fetch calls
  await expect(tokenPromise).resolves.toEqual(tokenData);

  expect(fetch).toHaveBeenNthCalledWith(
    2,
    YANDEX_OAUTH_TOKEN_URL,
    expect.objectContaining({
      body: new URLSearchParams({ grant_type: 'authorization_code', code: '654321' })
    })
  );
});
