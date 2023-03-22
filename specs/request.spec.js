import https from 'node:https';
import { describe, test, expect, beforeEach, vi } from 'vitest';

import { request } from '../lib/request.js';

vi.mock('https', async () => await import('./__mocks__/https.mock.js'));

beforeEach(() => vi.spyOn(https, 'request'));

describe('Request', () => {
  test('should return promise', () => {
    const promise = request('https://www.example.com');

    expect(promise).toBeInstanceOf(Promise);
  });

  test('should use https.request', () => {
    request('https://www.example.com');

    expect(https.request).toHaveBeenCalled();
    expect(https._lastRequest._isSent).toBe(true);
  });

  test('should pass method, headers and parameters', () => {
    request('https://www.example.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      params: {
        foo: 'bar'
      }
    });

    expect(https.request).toHaveBeenCalledWith(
      'https://www.example.com?foo=bar',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      },
      expect.any(Function)
    );
    expect(https._lastRequest._isSent).toBe(true);
  });

  test('send the data', () => {
    const data = JSON.stringify({ foo: 'bar' });
    request('https://www.example.com', { method: 'POST' }, data);

    const { _lastRequest } = https;

    expect(_lastRequest._isSent).toBe(true);
    expect(_lastRequest._sentData).toBe(data);
  });
});

describe('Success', () => {
  test('should handle success JSON-alike responses', () => {
    const responsePromise = request('https://www.example.com');

    https._lastRequest._respondWith(200, JSON.stringify({ foo: 'bar' }));

    expect(responsePromise).resolves.toEqual({ foo: 'bar' });
  });

  test('should handle success non-JSON responses', () => {
    const responsePromise = request('https://www.example.com', { asJson: false });

    https._lastRequest._respondWith(200, 'Hello, world!');

    expect(responsePromise).resolves.toBe('Hello, world!');
  });
});

describe('Error', () => {
  test('should handle errors occur during requests', () => {
    const responsePromise = request('https://www.example.com');

    const error = new Error('Failed to send request!');

    https._lastRequest._triggerError(error);

    expect(responsePromise).rejects.toBe(error);
  });

  test('should handle error responses', () => {
    const responsePromise = request('https://www.example.com');

    https._lastRequest._respondWith(
      400,
      JSON.stringify({ error: 'Bad Request', error_description: 'Wrong list of parameters!' })
    );

    expect(responsePromise).rejects.toThrowError('Wrong list of parameters!');
  });

  test('should reject promise if response cannot be parsed as JSON', () => {
    const responsePromise = request('https://www.example.com');

    https._lastRequest._respondWith(200, 'Hello, World!');

    expect(responsePromise).rejects.toThrowError(/Unexpected token/);
  });

  test('should handle error responses w/o description', () => {
    const responsePromise = request('https://www.example.com');

    https._lastRequest._respondWith(500, JSON.stringify({ error: 'Bad Request' }));

    expect(responsePromise).rejects.toThrowError('Unknown error');
  });
});
