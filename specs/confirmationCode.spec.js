import http from 'node:http';
import readline from 'node:readline/promises';
import { beforeEach, afterEach, describe, test, mock } from 'node:test';
import assert from 'node:assert/strict';

import { useReadlineMock, readlineMock } from './__mocks__/readline.mock.js';
import { YANDEX_OAUTH_VERIFICATION_URL } from '../lib/constants.js';

import {
  getConfirmationCodeUrl,
  readConfirmationCodeAutomatically,
  readConfirmationCode
} from '../lib/confirmationCode.js';

const CLIENT_ID = '5adf8be37370000000000d630546c150';

describe('getConfirmationCodeUrl', () => {
  test('should return URL', () => {
    assert.strictEqual(
      getConfirmationCodeUrl(CLIENT_ID),
      `${YANDEX_OAUTH_VERIFICATION_URL}?client_id=${CLIENT_ID}&response_type=code`
    );
  });

  test('should add additional options to the URL', () => {
    assert.strictEqual(
      getConfirmationCodeUrl(CLIENT_ID, {
        deviceID: 'my-laptop',
        deviceName: 'My Super Duper Laptop',
        forceConfirm: true
      }),
      `${YANDEX_OAUTH_VERIFICATION_URL}?client_id=${CLIENT_ID}&response_type=code&device_id=my-laptop&device_name=My+Super+Duper+Laptop&force_confirm=true`
    );
  });
});

describe('readConfirmationCodeAutomatically', () => {
  beforeEach(() => {
    const originalCreateServer = http.createServer.bind(http);
    mock.method(http, 'createServer', (...args) => {
      const server = originalCreateServer(...args);
      server.unref();
      return server;
    });
  });
  afterEach(() => mock.restoreAll());

  test('should create server and return promise', () => {
    assert.ok(readConfirmationCodeAutomatically('http://localhost:8889') instanceof Promise);
    assert.ok(http.createServer.mock.callCount() > 0);
  });

  test('should read test automatically using http server', async () => {
    const readConfirmationCodePromise = readConfirmationCodeAutomatically('http://localhost:8899');

    const serverResponse = await _requestToServer('http://localhost:8899', 827364);

    assert.strictEqual(await readConfirmationCodePromise, '827364');
    assert.strictEqual(serverResponse.statusCode, 200);
    assert.strictEqual(
      serverResponse.body,
      '<!doctype html><title>Saving the code…</title><body><p>We got the code! The window will be close in 3s</p><script>setTimeout(() => window.close(), 3000)</script></body>'
    );
  });

  test('should reject promise if input request has no code parameter', async () => {
    const readConfirmationCodePromise = readConfirmationCodeAutomatically('http://localhost:8999');

    _requestToServer('http://localhost:8999');

    await assert.rejects(readConfirmationCodePromise, { message: "Confirmation code wasn't returned!" });
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
  useReadlineMock();

  test('should return promise', () => {
    assert.ok(readConfirmationCode() instanceof Promise);
  });

  test('should create a new readline interface', () => {
    readConfirmationCode();

    assert.strictEqual(readline.createInterface.mock.callCount(), 1);
    assert.deepStrictEqual(readline.createInterface.mock.calls[0].arguments, [
      {
        input: process.stdin,
        output: process.stdout
      }
    ]);
  });

  test('should show the request', () => {
    readConfirmationCode();

    assert.strictEqual(readlineMock._lastInterface._lastQuestion._title, 'Enter confirmation code: ');
  });

  test('should show the request with custom title', () => {
    readConfirmationCode('Enter your super secret code: ');

    assert.strictEqual(readlineMock._lastInterface._lastQuestion._title, 'Enter your super secret code: ');
  });

  test('should read confirmation code from console', async () => {
    const confirmationCodePromise = readConfirmationCode();

    readlineMock._lastInterface._lastQuestion._answer('098721');

    assert.strictEqual(await confirmationCodePromise, '098721');
  });
});
