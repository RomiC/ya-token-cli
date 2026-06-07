import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { camelToSnake, camelToSnakeObject } from '../lib/camelToSnake.js';

describe('camelToSnake', () => {
  test('converting string from camelCase to snake_case', () => {
    assert.strictEqual(camelToSnake('simpleCase'), 'simple_case');
    assert.strictEqual(camelToSnake('stringContainsSeveralWords'), 'string_contains_several_words');
    assert.strictEqual(
      camelToSnake('stringWithSeveralUpperCaseLettersInROW'),
      'string_with_several_upper_case_letters_in_row'
    );
  });
});

describe('camelToSnakeObject', () => {
  test('converting object properties from camelCase to snake_case', () => {
    assert.deepStrictEqual(
      camelToSnakeObject({
        simpleCase: true,
        moreDifficultCase: 'bar',
        aFewUpperCaseLettersInROW: 999
      }),
      {
        simple_case: true,
        more_difficult_case: 'bar',
        a_few_upper_case_letters_in_row: 999
      }
    );
  });
});
