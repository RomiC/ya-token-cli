import { mock } from 'node:test';
import { describe, test, expect, beforeEach } from 'vitest';

import { request } from '../lib/request.js';

let fetchMock;

describe('Request', () => {
  beforeEach(() => {
    mock.restoreAll();
    fetchMock = mock.method(globalThis, 'fetch', async () => ({
      status: 200,
      text: async () => JSON.stringify({ foo: 'bar' })
    }));
  });

  test('should return promise', () => {
    const promise = request('https://www.example.com');

    expect(promise).toBeInstanceOf(Promise);
  });

  test('should use fetch', () => {
    request('https://www.example.com');

    expect(fetchMock.mock.calls.length).toBe(1);
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

    expect(fetchMock.mock.calls[0].arguments[0]).toBe('https://www.example.com?foo=bar');
    expect(fetchMock.mock.calls[0].arguments[1]).toEqual({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  });

  test('send the data', () => {
    const data = JSON.stringify({ foo: 'bar' });
    request('https://www.example.com', { method: 'POST' }, data);

    expect(fetchMock.mock.calls[0].arguments[1].body).toBe(data);
  });
});

describe('Success', () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  test('should handle success JSON-alike responses', () => {
    mock.method(globalThis, 'fetch', async () => ({
      status: 200,
      text: async () => JSON.stringify({ foo: 'bar' })
    }));

    expect(request('https://www.example.com')).resolves.toEqual({ foo: 'bar' });
  });

  test('should handle success non-JSON responses', () => {
    mock.method(globalThis, 'fetch', async () => ({
      status: 200,
      text: async () => 'Hello, world!'
    }));

    expect(request('https://www.example.com', { asJson: false })).resolves.toBe('Hello, world!');
  });
});

describe('Error', () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  test('should handle errors occur during requests', () => {
    const error = new Error('Failed to send request!');
    mock.method(globalThis, 'fetch', async () => {
      throw error;
    });

    expect(request('https://www.example.com')).rejects.toBe(error);
  });

  test('should handle error responses', () => {
    mock.method(globalThis, 'fetch', async () => ({
      status: 400,
      text: async () => JSON.stringify({ error: 'Bad Request', error_description: 'Wrong list of parameters!' })
    }));

    expect(request('https://www.example.com')).rejects.toThrowError('Wrong list of parameters!');
  });

  test('should reject promise if response cannot be parsed as JSON', () => {
    mock.method(globalThis, 'fetch', async () => ({
      status: 200,
      text: async () => 'Hello, World!'
    }));

    expect(request('https://www.example.com')).rejects.toThrowError(/Unexpected token/);
  });

  test('should handle error responses w/o description', () => {
    mock.method(globalThis, 'fetch', async () => ({
      status: 500,
      text: async () => JSON.stringify({ error: 'Bad Request' })
    }));

    expect(request('https://www.example.com')).rejects.toThrowError('Unknown error');
  });
});
