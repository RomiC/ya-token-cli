import * as dotenv from 'dotenv';
dotenv.config();

import http from 'node:http';
import { mock } from 'node:test';
import readline from 'node:readline';
import { beforeEach, expect, test, vi } from 'vitest';

import { CLCK_API_URL, YANDEX_OAUTH_TOKEN_URL } from '../lib/constants.js';

import { auth } from '../index.js';

const { YANDEX_CLIENT_ID, YANDEX_CLIENT_SECRET } = process.env;

vi.mock('node:readline', async () => await import('../specs/__mocks__/readline.mock.js'));

beforeEach(() => {
  mock.restoreAll();
  readline._resetMock();
});

test('should obtain token automatically via redirect', async () => {
  const tokenData = {
    access_token: 'y0_AgAEA7qgzyLRAAaWDgAAAADgI3BPgdP-9iReTuKIx7XZ7K1E9L8Ghlg',
    expires_in: 31500508,
    refresh_token:
      '1:UeN5U8DLk19sj0zP:E644ZJdv6QNr9oE7K1eV0gSb-y82LpiWbSHljIQk_OYaYKzMD l9MOLk5WZGNUQqtrAYwBFB4yELBEw:AARCIbr3VJGTCGiVd3Au8A',
    token_type: 'bearer'
  };
  const fetchMock = mock.method(globalThis, 'fetch', async (url) => {
    if (url.toString().startsWith(CLCK_API_URL)) {
      return {
        status: 200,
        text: async () => 'https://clck.ru/3498ab'
      };
    }

    if (url.toString() === YANDEX_OAUTH_TOKEN_URL) {
      return {
        status: 200,
        text: async () => JSON.stringify(tokenData)
      };
    }

    throw new Error(`Unexpected URL: ${url.toString()}`);
  });

  const tokenPromise = auth(YANDEX_CLIENT_ID, YANDEX_CLIENT_SECRET, { redirectURI: 'http://localhost:9999' });

  expect(tokenPromise).toBeInstanceOf(Promise);
  await vi.waitFor(() => expect(fetchMock.mock.calls[0].arguments[0]).toMatch(CLCK_API_URL));

  await new Promise((resolve, reject) => {
    const req = http.request('http://localhost:9999/?code=123456', (response) =>
      response.statusCode === 200 ? resolve() : reject(response.statusCode)
    );
    req.end();
  });

  await vi.waitFor(() => expect(fetchMock.mock.calls.length).toBe(2));

  expect(fetchMock.mock.calls[1].arguments[0]).toBe(YANDEX_OAUTH_TOKEN_URL);
  expect(fetchMock.mock.calls[1].arguments[1].body.toString()).toBe('grant_type=authorization_code&code=123456');

  await expect(tokenPromise).resolves.toEqual(tokenData);
});

test('should obtain token requesting confirmation code from the user', async () => {
  const tokenData = {
    access_token: 'y0_AgAEA7qgzyLRAAa000000000I3BPgdP-9iReTuKIx7XZ7K1E9L8Ghlg',
    expires_in: 31500508,
    refresh_token:
      '1:UeN5U8DLk19sj0zP:E644ZJdv6QNr9oE7K1eV0gSb-y82LpiWbSHljIQk_OYaYKzMD l9MOLk5WZGNUQqtrAYwBFB4yELBEw:AARCIbr3VJGTCGiVd3Au8A',
    token_type: 'bearer'
  };
  const fetchMock = mock.method(globalThis, 'fetch', async (url) => {
    if (url.toString().startsWith(CLCK_API_URL)) {
      return {
        status: 200,
        text: async () => 'https://clck.ru/3498ff'
      };
    }

    if (url.toString() === YANDEX_OAUTH_TOKEN_URL) {
      return {
        status: 200,
        text: async () => JSON.stringify(tokenData)
      };
    }

    throw new Error(`Unexpected URL: ${url.toString()}`);
  });

  const tokenPromise = auth(YANDEX_CLIENT_ID, YANDEX_CLIENT_SECRET, {}, true, false);

  expect(tokenPromise).toBeInstanceOf(Promise);
  await vi.waitFor(() => expect(fetchMock.mock.calls[0].arguments[0]).toMatch(CLCK_API_URL));

  await vi.waitFor(() => expect(readline._lastInterface).toBeDefined());

  const readlineQuestion = readline._lastInterface._lastQuestion;

  expect(readlineQuestion._title).toBe('Enter confirmation code: ');

  readlineQuestion._answer('654321');
  await vi.waitFor(() => expect(fetchMock.mock.calls.length).toBe(2));

  expect(fetchMock.mock.calls[1].arguments[0]).toBe(YANDEX_OAUTH_TOKEN_URL);
  expect(fetchMock.mock.calls[1].arguments[1].body.toString()).toBe('grant_type=authorization_code&code=654321');

  await expect(tokenPromise).resolves.toEqual(tokenData);
});
