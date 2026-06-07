import { test } from 'node:test';
import assert from 'node:assert/strict';

import { auth } from '../index.js';
import { auth as authSrc } from '../lib/auth.js';

test('should export auth', () => {
  assert.ok(auth instanceof Function);
  assert.strictEqual(auth, authSrc);
});
