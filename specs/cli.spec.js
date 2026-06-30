import http from 'node:http';
import { beforeEach, afterEach, test, mock } from 'node:test';
import assert from 'node:assert/strict';

import { useReadlineMock, readlineMock } from './__mocks__/readline.mock.js';
import { useFetchMock, createFetchMock } from './__mocks__/fetch.mock.js';
import { main } from '../bin/ya-token-cli.js';

const ORIGINAL_ENV = { ...process.env };

useReadlineMock();
useFetchMock();

beforeEach(() => {
  mock.method(process, 'exit', () => {});
  mock.method(process.stdout, 'write', () => {});
  mock.method(process.stderr, 'write', () => {});
  // Clear Yandex-related env vars for a clean slate
  delete process.env.YANDEX_CLIENT_ID;
  delete process.env.YANDEX_CLIENT_SECRET;
  delete process.env.REDIRECT_URI;
});

afterEach(() => {
  mock.restoreAll();
  process.env = { ...ORIGINAL_ENV };
});

// ---------------------------------------------------------------------------
// main() — error handling (answers prompts with empty to trigger validation)
// ---------------------------------------------------------------------------

test('main() exits when client-id is missing', async () => {
  process.env.YANDEX_CLIENT_SECRET = 'env-secret';

  // Provide a fetch mock so auth() doesn't fail if it runs
  createFetchMock({ body: { access_token: 'dummy' } });

  const mainPromise = main(['node', 'bin/ya-token-cli.js', '--manual']);

  // Prompt for client-id — answer empty to trigger validation
  const q = readlineMock._lastInterface._lastQuestion;
  assert.strictEqual(q._title, 'Enter Yandex Client ID: ');
  q._answer('');

  // Answer confirmation code prompt from auth() in manual mode
  await new Promise(process.nextTick);
  const codeQ = readlineMock._lastInterface._lastQuestion;
  codeQ._answer('dummy');

  await mainPromise;

  // process.exit was called with error code for missing client-id
  assert.strictEqual(process.exit.mock.callCount(), 1);
  assert.strictEqual(process.exit.mock.calls[0].arguments[0], 1);

  assert.ok(
    process.stderr.write.mock.calls.some(
      (call) => typeof call.arguments[0] === 'string' && call.arguments[0].includes('client-id is required')
    )
  );
});

test('main() exits when client-secret is missing', async () => {
  process.env.YANDEX_CLIENT_ID = 'env-cid';

  createFetchMock({ body: { access_token: 'dummy' } });

  const mainPromise = main(['node', 'bin/ya-token-cli.js', '--manual']);

  // Prompt for client-secret — answer empty
  const q = readlineMock._lastInterface._lastQuestion;
  assert.strictEqual(q._title, 'Enter Yandex Client Secret: ');
  q._answer('');

  // Answer confirmation code prompt from auth() in manual mode
  await new Promise(process.nextTick);
  const codeQ = readlineMock._lastInterface._lastQuestion;
  codeQ._answer('dummy');

  await mainPromise;

  assert.strictEqual(process.exit.mock.callCount(), 1);
  assert.strictEqual(process.exit.mock.calls[0].arguments[0], 1);

  assert.ok(
    process.stderr.write.mock.calls.some(
      (call) => typeof call.arguments[0] === 'string' && call.arguments[0].includes('client-secret is required')
    )
  );
});

test('main() displays help with --help', async () => {
  let helpOutput = '';
  mock.method(process.stdout, 'write', (chunk) => {
    helpOutput += chunk;
  });

  // Restore process.exit mock so --help can exit cleanly
  // but continue watching for the actual exit call
  const exitSpy = mock.fn(() => {});
  process.exit = exitSpy;

  await main(['node', 'bin/ya-token-cli.js', '--help']);

  // process.exit(0) was called by commander via our wrapper
  assert.strictEqual(exitSpy.mock.callCount(), 1);
  assert.strictEqual(exitSpy.mock.calls[0].arguments[0], 0);

  assert.ok(helpOutput.includes('ya-token-cli'));
  assert.ok(helpOutput.includes('--client-id'));
  assert.ok(helpOutput.includes('--client-secret'));
  assert.ok(helpOutput.includes('--redirect-uri'));
  assert.ok(helpOutput.includes('--manual'));
  assert.ok(helpOutput.includes('--short-url'));
  assert.ok(helpOutput.includes('--help'));
});

// ---------------------------------------------------------------------------
// main() — successful auth via mocked fetch and readline
// ---------------------------------------------------------------------------

test('main() all flags manual mode with short URL', async () => {
  const tokenData = {
    access_token: 'test-token-manual',
    expires_in: 3600,
    refresh_token: 'test-refresh',
    token_type: 'bearer'
  };

  createFetchMock({ body: 'https://clck.ru/manual' }); // clck.ru
  createFetchMock({ body: tokenData }); // token exchange

  const mainPromise = main([
    'node',
    'bin/ya-token-cli.js',
    '--client-id',
    'test-cid',
    '--client-secret',
    'test-csecret',
    '--manual',
    '--short-url'
  ]);

  // auth() calls readConfirmationCode() — answer the code prompt
  await new Promise(process.nextTick);
  const codeQuestion = readlineMock._lastInterface._lastQuestion;
  assert.strictEqual(codeQuestion._title, 'Enter confirmation code: ');
  codeQuestion._answer('123456');

  await mainPromise;

  assert.strictEqual(process.exit.mock.callCount(), 0); // success
  assert.ok(fetch.mock.callCount() >= 1);
  assert.ok(
    process.stdout.write.mock.calls.some(
      (call) => typeof call.arguments[0] === 'string' && call.arguments[0].includes('Token obtained successfully')
    )
  );
});

test('main() all flags automatic mode with redirect URI', async () => {
  const tokenData = {
    access_token: 'test-token-auto',
    expires_in: 3600,
    refresh_token: 'test-refresh',
    token_type: 'bearer'
  };

  createFetchMock({ body: tokenData }); // token exchange (no clck.ru)

  const mainPromise = main([
    'node',
    'bin/ya-token-cli.js',
    '--client-id',
    'auto-cid',
    '--client-secret',
    'auto-csecret',
    '--redirect-uri',
    'http://localhost:18888'
  ]);

  // Wait for the redirect server to start
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Simulate Yandex OAuth redirect
  await new Promise((resolve, reject) => {
    const req = http.request('http://localhost:18888/?code=654321', (response) => {
      response.resume();
      response.statusCode === 200 ? resolve() : reject(response.statusCode);
    });
    req.on('error', reject);
    req.end();
  });

  await mainPromise;

  assert.strictEqual(process.exit.mock.callCount(), 0); // success
  assert.ok(
    process.stdout.write.mock.calls.some(
      (call) => typeof call.arguments[0] === 'string' && call.arguments[0].includes('Token obtained successfully')
    )
  );
});

test('main() without --short-url suppresses clck.ru call (default off)', async () => {
  const tokenData = { access_token: 'no-short', expires_in: 3600, token_type: 'bearer' };

  createFetchMock({ body: tokenData }); // only token exchange

  const mainPromise = main([
    'node',
    'bin/ya-token-cli.js',
    '--client-id',
    'cid',
    '--client-secret',
    'secret',
    '--redirect-uri',
    'http://localhost:18889'
    // --short-url not passed = off by default
  ]);

  await new Promise((resolve) => setTimeout(resolve, 50));

  await new Promise((resolve, reject) => {
    const req = http.request('http://localhost:18889/?code=111111', (response) => {
      response.resume();
      response.statusCode === 200 ? resolve() : reject(response.statusCode);
    });
    req.on('error', reject);
    req.end();
  });

  await mainPromise;

  // Should only have one fetch call (token exchange), no clck.ru
  assert.strictEqual(fetch.mock.callCount(), 1);
});

// ---------------------------------------------------------------------------
// main() — env vars
// ---------------------------------------------------------------------------

test('main() uses env vars when flags are not provided', async () => {
  process.env.YANDEX_CLIENT_ID = 'env-cid';
  process.env.YANDEX_CLIENT_SECRET = 'env-csecret';
  process.env.REDIRECT_URI = 'http://localhost:18890';

  const tokenData = { access_token: 'env-token', expires_in: 3600, token_type: 'bearer' };
  createFetchMock({ body: tokenData });

  const mainPromise = main(['node', 'bin/ya-token-cli.js', '--manual']);

  // auth() in manual mode asks for confirmation code
  await new Promise(process.nextTick);
  const codeQuestion = readlineMock._lastInterface._lastQuestion;
  codeQuestion._answer('env-code');

  await mainPromise;

  assert.strictEqual(process.exit.mock.callCount(), 0); // success
  assert.ok(
    process.stdout.write.mock.calls.some(
      (call) => typeof call.arguments[0] === 'string' && call.arguments[0].includes('Token obtained successfully')
    )
  );
});

test('main() flag overrides env var', async () => {
  process.env.YANDEX_CLIENT_ID = 'env-cid';
  process.env.YANDEX_CLIENT_SECRET = 'env-csecret';

  const tokenData = { access_token: 'flag-wins', expires_in: 3600, token_type: 'bearer' };
  createFetchMock({ body: tokenData });

  const mainPromise = main([
    'node',
    'bin/ya-token-cli.js',
    '--client-id',
    'flag-cid',
    '--redirect-uri',
    'http://localhost:18891',
    '--manual'
  ]);

  // auth() in manual mode asks for confirmation code
  await new Promise(process.nextTick);
  const codeQuestion = readlineMock._lastInterface._lastQuestion;
  codeQuestion._answer('flag-code');

  await mainPromise;

  assert.strictEqual(process.exit.mock.callCount(), 0); // success
});

// ---------------------------------------------------------------------------
// main() — interactive prompts
// ---------------------------------------------------------------------------

test('main() prompts for missing client-secret', async () => {
  process.env.YANDEX_CLIENT_ID = 'env-cid';

  const tokenData = { access_token: 'prompt-secret', expires_in: 3600, token_type: 'bearer' };
  createFetchMock({ body: tokenData });

  const mainPromise = main(['node', 'bin/ya-token-cli.js', '--manual']);

  // Should prompt only for client-secret (client-id is in env)
  const secretQuestion = readlineMock._lastInterface._lastQuestion;
  assert.strictEqual(secretQuestion._title, 'Enter Yandex Client Secret: ');
  secretQuestion._answer('my-secret');

  // auth() in manual mode then asks for confirmation code
  await new Promise(process.nextTick);
  const codeQuestion = readlineMock._lastInterface._lastQuestion;
  codeQuestion._answer('sec-code');

  await mainPromise;

  assert.strictEqual(process.exit.mock.callCount(), 0); // success
  assert.ok(
    process.stdout.write.mock.calls.some(
      (call) => typeof call.arguments[0] === 'string' && call.arguments[0].includes('Token obtained successfully')
    )
  );
});

test('main() prompts for mode and redirect-uri when neither flag is set', async () => {
  const tokenData = { access_token: 'prompt-mode', expires_in: 3600, token_type: 'bearer' };
  createFetchMock({ body: tokenData });

  const mainPromise = main(['node', 'bin/ya-token-cli.js', '--client-id', 'cid', '--client-secret', 'csecret']);

  // Answer mode: yes to automatic
  const modeQuestion = readlineMock._lastInterface._lastQuestion;
  assert.strictEqual(modeQuestion._title, 'Obtain token automatically via redirect? (Y): ');
  modeQuestion._answer('Y');

  // Wait for next prompt
  await new Promise(process.nextTick);

  // Answer redirect URI
  const redirectQuestion = readlineMock._lastInterface._lastQuestion;
  assert.strictEqual(redirectQuestion._title, 'Enter Redirect URI (http://localhost:8899): ');
  redirectQuestion._answer('http://localhost:18892');

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Simulate redirect
  await new Promise((resolve, reject) => {
    const req = http.request('http://localhost:18892/?code=auto-code', (response) => {
      response.resume();
      response.statusCode === 200 ? resolve() : reject(response.statusCode);
    });
    req.on('error', reject);
    req.end();
  });

  await mainPromise;

  assert.strictEqual(process.exit.mock.callCount(), 0); // success
});

test('main() prompts for mode — user chooses manual', async () => {
  const tokenData = { access_token: 'choose-manual', expires_in: 3600, token_type: 'bearer' };
  createFetchMock({ body: 'https://clck.ru/manual-choice' }); // short URL
  createFetchMock({ body: tokenData }); // token exchange

  const mainPromise = main([
    'node',
    'bin/ya-token-cli.js',
    '--client-id',
    'cid',
    '--client-secret',
    'csecret',
    '--short-url'
  ]);

  // Answer mode: no to automatic → manual
  const modeQuestion = readlineMock._lastInterface._lastQuestion;
  assert.strictEqual(modeQuestion._title, 'Obtain token automatically via redirect? (Y): ');
  modeQuestion._answer('n');

  // Wait for auth() to start and prompt for confirmation code
  await new Promise(process.nextTick);

  // auth() in manual mode asks for confirmation code
  const codeQuestion = readlineMock._lastInterface._lastQuestion;
  assert.strictEqual(codeQuestion._title, 'Enter confirmation code: ');
  codeQuestion._answer('manual-code');

  await mainPromise;

  assert.strictEqual(process.exit.mock.callCount(), 0); // success
  assert.ok(
    process.stdout.write.mock.calls.some(
      (call) => typeof call.arguments[0] === 'string' && call.arguments[0].includes('Token obtained successfully')
    )
  );
});
