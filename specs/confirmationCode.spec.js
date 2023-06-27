import http from 'node:http';
import readline from 'node:readline';
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

import { YANDEX_OAUTH_VERIFICATION_URL } from '../lib/constants.js';

import {
  getConfirmationCodeUrl,
  readConfirmationCodeAutomatically,
  readConfirmationCode
} from '../lib/confirmationCode.js';

vi.mock('readline', async () => await import('./__mocks__/readline.mock.js'));

const CLIENT_ID = '5adf8be37370000000000d630546c150';

describe('getConfirmationCodeUrl', () => {
  test('should return URL', () => {
    expect(getConfirmationCodeUrl(CLIENT_ID)).toBe(
      `${YANDEX_OAUTH_VERIFICATION_URL}?client_id=${CLIENT_ID}&response_type=code`
    );
  });

  test('should add additional options to the URL', () => {
    expect(
      getConfirmationCodeUrl(CLIENT_ID, {
        deviceID: 'my-laptop',
        deviceName: 'My Super Duper Laptop',
        forceConfirm: true
      })
    ).toBe(
      `${YANDEX_OAUTH_VERIFICATION_URL}?client_id=${CLIENT_ID}&response_type=code&device_id=my-laptop&device_name=My%20Super%20Duper%20Laptop&force_confirm=true`
    );
  });
});

describe('readConfirmationCodeAutomatically', () => {
  beforeAll(() => vi.spyOn(http, 'createServer'));
  beforeEach(() => vi.useFakeTimers());

  test('should create server and return promise', () => {
    expect(readConfirmationCodeAutomatically('http://localhost:8889')).toBeInstanceOf(Promise);
    expect(http.createServer).toHaveBeenCalled();
  });

  test('should read test automatically using http server', async () => {
    const readConfirmationCodePromise = readConfirmationCodeAutomatically('http://localhost:8899');

    const serverResponse = await _requestToServer('http://localhost:8899', 827364);

    await expect(readConfirmationCodePromise).resolves.toBe('827364');
    expect(serverResponse.statusCode).toBe(200);
    expect(serverResponse.body).toBe(
      '<!doctype html><title>Saving the code…</title><body><p>We got the code! The window will be close in 3s</p><script>setTimeout(() => window.close(), 3000)</script></body>'
    );
  });

  test('should reject promise if input request has no code parameter', async () => {
    const readConfirmationCodePromise = readConfirmationCodeAutomatically('http://localhost:8999');

    _requestToServer('http://localhost:8999');

    await expect(readConfirmationCodePromise).rejects.toThrow("Confirmation code wasn't returned!");
  });

  function _requestToServer(url, code = null) {
    return new Promise((resolve) => {
      const req = http.request(url + (code != null ? `?code=${code}` : ''), (response) => {
        let data = '';
        response.on('data', (chunk) => (data += chunk));
        response.on('end', () => resolve({ statusCode: response.statusCode, body: data }));
      });
      req.end();
    });
  }
});

describe('readConfirmationCode()', () => {
  beforeEach(() => readline._resetMock());

  test('should return promise', () => {
    expect(readConfirmationCode()).toBeInstanceOf(Promise);
  });

  test('should create a new readline interface', () => {
    vi.spyOn(readline, 'createInterface');

    readConfirmationCode();

    expect(readline.createInterface).toHaveBeenCalledWith({
      input: process.stdin,
      output: process.stdout
    });
  });

  test('should show the request', () => {
    readConfirmationCode();

    expect(readline._lastInterface._lastQuestion._title).toBe('Enter confirmation code: ');
  });

  test('should show the request with custom title', () => {
    readConfirmationCode('Enter your super secret code: ');

    expect(readline._lastInterface._lastQuestion._title).toBe('Enter your super secret code: ');
  });

  test('should read confirmation code from console', async () => {
    const confirmationCodePromise = readConfirmationCode();

    readline._lastInterface._lastQuestion._answer('098721');

    await expect(confirmationCodePromise).resolves.toBe('098721');
  });
});
