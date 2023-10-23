import { expect, test } from 'vitest';

import Defer from '../../lib/defer.js';

test('should be a class', () => {
  expect(new Defer()).toBeInstanceOf(Defer);
});

test('should return promise and controls', () => {
  const { promise, resolve, reject } = new Defer();

  expect(promise).toBeInstanceOf(Promise);
  expect(resolve).toBeInstanceOf(Function);
  expect(reject).toBeInstanceOf(Function);
});

test('should resolve promise', () => {
  const { promise, resolve } = new Defer();

  resolve('some data');

  expect(promise).resolves.toBe('some data');
});

test('should reject promise', () => {
  const { promise, reject } = new Defer();

  const err = new Error('some error');
  reject(err);

  expect(promise).rejects.toBe(err);
});
