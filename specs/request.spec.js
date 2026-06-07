import { describe, test, expect } from 'vitest';

import { useFetchMock, createFetchMock } from './__mocks__/fetch.mock.js';
import { request } from '../lib/request.js';

useFetchMock();

describe('Request', () => {
  test('should return promise', () => {
    createFetchMock();

    expect(request('https://www.example.com')).toBeInstanceOf(Promise);
  });

  test('should call fetch', () => {
    createFetchMock();

    request('https://www.example.com');

    expect(fetch).toHaveBeenCalled();
  });

  test('should pass method, headers and URL with parameters', () => {
    createFetchMock();

    request('https://www.example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      params: { foo: 'bar' }
    });

    expect(fetch).toHaveBeenCalledWith('https://www.example.com?foo=bar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: null
    });
  });

  test('should send data as body', () => {
    createFetchMock();

    const data = JSON.stringify({ foo: 'bar' });
    request('https://www.example.com', { method: 'POST' }, data);

    expect(fetch).toHaveBeenCalledWith('https://www.example.com', {
      method: 'POST',
      headers: {},
      body: data
    });
  });
});

describe('Success', () => {
  test('should handle success JSON-alike responses', async () => {
    createFetchMock({ body: { foo: 'bar' } });

    await expect(request('https://www.example.com')).resolves.toEqual({ foo: 'bar' });
  });

  test('should handle success non-JSON responses', async () => {
    createFetchMock({ body: 'Hello, world!' });

    await expect(request('https://www.example.com', { asJson: false })).resolves.toBe('Hello, world!');
  });
});

describe('Error', () => {
  test('should handle errors during fetch', async () => {
    const error = new Error('Failed to send request!');
    fetch.mockRejectedValue(error);

    await expect(request('https://www.example.com')).rejects.toBe(error);
  });

  test('should handle error responses', async () => {
    createFetchMock({
      status: 400,
      body: { error: 'Bad Request', error_description: 'Wrong list of parameters!' }
    });

    await expect(request('https://www.example.com')).rejects.toThrowError('Wrong list of parameters!');
  });

  test('should reject promise if response cannot be parsed as JSON', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token H in JSON at position 0');
      },
      text: async () => 'Hello, World!'
    });

    await expect(request('https://www.example.com')).rejects.toThrowError(/Unexpected token/);
  });

  test('should handle error responses w/o description', async () => {
    createFetchMock({ status: 500, body: { error: 'Internal Server Error' } });

    await expect(request('https://www.example.com')).rejects.toThrowError('Unknown error');
  });
});
