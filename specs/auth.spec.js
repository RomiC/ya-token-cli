import * as dotenv from 'dotenv';
dotenv.config();

import http from 'node:http';
import https from 'node:https';
import readline from 'node:readline';
import { beforeEach, expect, test, vi } from 'vitest';

import { CLCK_API_URL, YANDEX_OAUTH_TOKEN_URL } from '../lib/constants.js';

import { auth } from '../index.js';

const { YANDEX_CLIENT_ID, YANDEX_CLIENT_SECRET } = process.env;

vi.mock('https', async () => await import('../specs/__mocks__/https.mock.js'));
vi.mock('readline', async () => await import('../specs/__mocks__/readline.mock.js'));

beforeEach(() => {
  vi.spyOn(process.stdout, 'write');
  readline._resetMock();
});

test('should obtain token automatically via redirect', async () => {
  const tokenPromise = auth(YANDEX_CLIENT_ID, YANDEX_CLIENT_SECRET, { redirectURI: 'http://localhost:9999' });

  expect(tokenPromise).toBeInstanceOf(Promise);
  expect(https._lastRequest._context.url).toMatch(CLCK_API_URL);

  https._lastRequest._respondWith(200, 'https://clck.ru/3498ab');
  await new Promise((resolve) => setTimeout(resolve, 1000));

  expect(process.stdout.write).toHaveBeenCalledWith(expect.stringMatching('Visit https://clck.ru/3498ab'));
  expect(process.stdout.write).toHaveBeenCalledWith(expect.stringContaining('Server listening on port 9999'));

  await new Promise((resolve, reject) => {
    const req = http.request('http://localhost:9999/?code=123456', (response) =>
      response.statusCode === 200 ? resolve() : reject(response.statusCode)
    );
    req.end();
  });

  expect(https._lastRequest._context.url).toBe(YANDEX_OAUTH_TOKEN_URL);
  expect(https._lastRequest._sentData).toBe('grant_type=authorization_code&code=123456');

  https._lastRequest._respondWith(
    200,
    JSON.stringify({
      access_token: 'y0_AgAEA7qgzyLRAAaWDgAAAADgI3BPgdP-9iReTuKIx7XZ7K1E9L8Ghlg',
      expires_in: 31500508,
      refresh_token:
        '1:UeN5U8DLk19sj0zP:E644ZJdv6QNr9oE7K1eV0gSb-y82LpiWbSHljIQk_OYaYKzMD l9MOLk5WZGNUQqtrAYwBFB4yELBEw:AARCIbr3VJGTCGiVd3Au8A',
      token_type: 'bearer'
    })
  );

  await expect(tokenPromise).resolves.toEqual({
    access_token: 'y0_AgAEA7qgzyLRAAaWDgAAAADgI3BPgdP-9iReTuKIx7XZ7K1E9L8Ghlg',
    expires_in: 31500508,
    refresh_token:
      '1:UeN5U8DLk19sj0zP:E644ZJdv6QNr9oE7K1eV0gSb-y82LpiWbSHljIQk_OYaYKzMD l9MOLk5WZGNUQqtrAYwBFB4yELBEw:AARCIbr3VJGTCGiVd3Au8A',
    token_type: 'bearer'
  });
});

test('should obtain token requesting confirmation code from the user', async () => {
  const tokenPromise = auth(YANDEX_CLIENT_ID, YANDEX_CLIENT_SECRET, {}, true, false);

  expect(tokenPromise).toBeInstanceOf(Promise);
  expect(https._lastRequest._context.url).toMatch(CLCK_API_URL);

  https._lastRequest._respondWith(200, 'https://clck.ru/3498ff');
  await new Promise(process.nextTick);

  expect(process.stdout.write).toHaveBeenCalledWith(expect.stringMatching('Visit https://clck.ru/3498ff'));

  const readlineQuestion = readline._lastInterface._lastQuestion;

  expect(readlineQuestion._title).toBe('Enter confirmation code: ');

  readlineQuestion._answer('654321');
  await new Promise(process.nextTick);

  expect(https._lastRequest._context.url).toBe(YANDEX_OAUTH_TOKEN_URL);
  expect(https._lastRequest._sentData).toBe('grant_type=authorization_code&code=654321');

  https._lastRequest._respondWith(
    200,
    JSON.stringify({
      access_token: 'y0_AgAEA7qgzyLRAAa000000000I3BPgdP-9iReTuKIx7XZ7K1E9L8Ghlg',
      expires_in: 31500508,
      refresh_token:
        '1:UeN5U8DLk19sj0zP:E644ZJdv6QNr9oE7K1eV0gSb-y82LpiWbSHljIQk_OYaYKzMD l9MOLk5WZGNUQqtrAYwBFB4yELBEw:AARCIbr3VJGTCGiVd3Au8A',
      token_type: 'bearer'
    })
  );

  await expect(tokenPromise).resolves.toEqual({
    access_token: 'y0_AgAEA7qgzyLRAAa000000000I3BPgdP-9iReTuKIx7XZ7K1E9L8Ghlg',
    expires_in: 31500508,
    refresh_token:
      '1:UeN5U8DLk19sj0zP:E644ZJdv6QNr9oE7K1eV0gSb-y82LpiWbSHljIQk_OYaYKzMD l9MOLk5WZGNUQqtrAYwBFB4yELBEw:AARCIbr3VJGTCGiVd3Au8A',
    token_type: 'bearer'
  });
});
