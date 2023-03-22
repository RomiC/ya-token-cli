import { expect, test } from 'vitest';

import { auth } from '../index.js';
import { auth as authSrc } from '../lib/auth.js';

test('should export auth', () => {
  expect(auth).toBeInstanceOf(Function);
  expect(auth).toBe(authSrc);
});
