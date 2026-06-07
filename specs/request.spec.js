import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { useFetchMock, createFetchMock } from './__mocks__/fetch.mock.js';
import { request } from '../lib/request.js';

useFetchMock();

describe('Request', () => {
  test('should return promise', () => {
    createFetchMock();

    assert.ok(request('https://www.example.com') instanceof Promise);
  });

  test('should call fetch', () => {
    createFetchMock();

    request('https://www.example.com');

    assert.ok(fetch.mock.callCount() > 0);
  });

  test('should pass method, headers and URL with parameters', () => {
    createFetchMock();

    request('https://www.example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      params: { foo: 'bar' }
    });

    assert.deepStrictEqual(fetch.mock.calls[0].arguments, [
      'https://www.example.com?foo=bar',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: null
      }
    ]);
  });

  test('should send data as body', () => {
    createFetchMock();

    const data = JSON.stringify({ foo: 'bar' });
    request('https://www.example.com', { method: 'POST' }, data);

    assert.deepStrictEqual(fetch.mock.calls[0].arguments, [
      'https://www.example.com',
      {
        method: 'POST',
        headers: {},
        body: data
      }
    ]);
  });
});

describe('Success', () => {
  test('should handle success JSON-alike responses', async () => {
    createFetchMock({ body: { foo: 'bar' } });

    assert.deepStrictEqual(await request('https://www.example.com'), { foo: 'bar' });
  });

  test('should handle success non-JSON responses', async () => {
    createFetchMock({ body: 'Hello, world!' });

    assert.strictEqual(await request('https://www.example.com', { asJson: false }), 'Hello, world!');
  });
});

describe('Error', () => {
  test('should handle errors during fetch', async () => {
    const error = new Error('Failed to send request!');
    fetch._queue.push(async () => {
      throw error;
    });

    const rejectedError = await request('https://www.example.com').catch((e) => e);
    assert.strictEqual(rejectedError, error);
  });

  test('should handle error responses', async () => {
    createFetchMock({
      status: 400,
      body: { error: 'Bad Request', error_description: 'Wrong list of parameters!' }
    });

    await assert.rejects(request('https://www.example.com'), { message: 'Wrong list of parameters!' });
  });

  test('should reject promise if response cannot be parsed as JSON', async () => {
    fetch._queue.push(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token H in JSON at position 0');
      },
      text: async () => 'Hello, World!'
    }));

    await assert.rejects(request('https://www.example.com'), /Unexpected token/);
  });

  test('should handle error responses w/o description', async () => {
    createFetchMock({ status: 500, body: { error: 'Internal Server Error' } });

    await assert.rejects(request('https://www.example.com'), { message: 'Unknown error' });
  });
});
