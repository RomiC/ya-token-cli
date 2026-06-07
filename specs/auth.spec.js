import http from 'node:http';
import { beforeEach, afterEach, test, mock } from 'node:test';
import assert from 'node:assert/strict';

import { useFetchMock, createFetchMock } from './__mocks__/fetch.mock.js';
import { useReadlineMock, readlineMock } from './__mocks__/readline.mock.js';
import { CLCK_API_URL, YANDEX_OAUTH_TOKEN_URL } from '../lib/constants.js';
import { auth } from '../index.js';

const { YANDEX_CLIENT_ID, YANDEX_CLIENT_SECRET } = process.env;

useFetchMock();
useReadlineMock();

beforeEach(() => {
  mock.method(process.stdout, 'write');
});

afterEach(() => mock.restoreAll());

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

  assert.ok(tokenPromise instanceof Promise);
  assert.ok(
    fetch.mock.calls.some((call) => typeof call.arguments[0] === 'string' && call.arguments[0].includes(CLCK_API_URL))
  );

  // Wait for the clck.ru response to process and the redirect server to start
  await new Promise((resolve) => setTimeout(resolve, 100));

  assert.ok(
    process.stdout.write.mock.calls.some(
      (call) => typeof call.arguments[0] === 'string' && call.arguments[0].includes('Visit https://clck.ru/3498ab')
    )
  );
  assert.ok(
    process.stdout.write.mock.calls.some(
      (call) => typeof call.arguments[0] === 'string' && call.arguments[0].includes('Server listening on port 9999')
    )
  );

  // Simulate Yandex OAuth redirect with the confirmation code
  await new Promise((resolve, reject) => {
    const req = http.request('http://localhost:9999/?code=123456', (response) =>
      response.statusCode === 200 ? resolve() : reject(response.statusCode)
    );
    req.end();
  });

  // Wait for the full token exchange to complete, then assert both fetch calls
  assert.deepStrictEqual(await tokenPromise, tokenData);

  assert.strictEqual(fetch.mock.calls[1].arguments[0], YANDEX_OAUTH_TOKEN_URL);
  assert.deepStrictEqual(
    [...fetch.mock.calls[1].arguments[1].body.entries()],
    [
      ['grant_type', 'authorization_code'],
      ['code', '123456']
    ]
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

  assert.ok(tokenPromise instanceof Promise);
  assert.ok(
    fetch.mock.calls.some((call) => typeof call.arguments[0] === 'string' && call.arguments[0].includes(CLCK_API_URL))
  );

  // Wait for the clck.ru response to process and the readline question to appear
  await new Promise(process.nextTick);

  assert.ok(
    process.stdout.write.mock.calls.some(
      (call) => typeof call.arguments[0] === 'string' && call.arguments[0].includes('Visit https://clck.ru/3498ff')
    )
  );

  const readlineQuestion = readlineMock._lastInterface._lastQuestion;
  assert.strictEqual(readlineQuestion._title, 'Enter confirmation code: ');

  readlineQuestion._answer('654321');

  // Wait for the full token exchange to complete, then assert both fetch calls
  assert.deepStrictEqual(await tokenPromise, tokenData);

  assert.strictEqual(fetch.mock.calls[1].arguments[0], YANDEX_OAUTH_TOKEN_URL);
  assert.deepStrictEqual(
    [...fetch.mock.calls[1].arguments[1].body.entries()],
    [
      ['grant_type', 'authorization_code'],
      ['code', '654321']
    ]
  );
});

test('should print full confirmation URL when niceUrl is disabled', async () => {
  const tokenData = {
    access_token: 'api-token-created-and-used-for-test-purposes-only',
    expires_in: 31500508,
    refresh_token: 'api-token-created-and-used-for-test-purposes-only',
    token_type: 'bearer'
  };

  createFetchMock({ body: tokenData }); // Only the token exchange, no URL shortener

  const tokenPromise = auth(YANDEX_CLIENT_ID, YANDEX_CLIENT_SECRET, {}, false, false);

  assert.ok(tokenPromise instanceof Promise);
  assert.strictEqual(fetch.mock.callCount(), 0); // No fetch call to clck.ru

  // Wait for the readline question to appear
  await new Promise(process.nextTick);

  // Should print the full OAuth URL, not a shortened one
  assert.ok(
    process.stdout.write.mock.calls.some(
      (call) =>
        typeof call.arguments[0] === 'string' && call.arguments[0].includes('Visit https://oauth.yandex.ru/authorize')
    )
  );

  const readlineQuestion = readlineMock._lastInterface._lastQuestion;
  assert.strictEqual(readlineQuestion._title, 'Enter confirmation code: ');

  readlineQuestion._answer('999999');

  // Wait for the full token exchange to complete
  assert.deepStrictEqual(await tokenPromise, tokenData);

  // Only one fetch call — the token exchange
  assert.strictEqual(fetch.mock.callCount(), 1);
  assert.strictEqual(fetch.mock.calls[0].arguments[0], YANDEX_OAUTH_TOKEN_URL);
  assert.deepStrictEqual(
    [...fetch.mock.calls[0].arguments[1].body.entries()],
    [
      ['grant_type', 'authorization_code'],
      ['code', '999999']
    ]
  );
});
