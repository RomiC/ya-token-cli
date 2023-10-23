import { describe, expect, test } from 'vitest';

import { camelToSnake, camelToSnakeObject } from '../../lib/camelToSnake.js';

describe('camelToSnake', () => {
  test('converting string from camelCase to snake_case', () => {
    expect(camelToSnake('simpleCase')).toBe('simple_case');
    expect(camelToSnake('stringContainsSeveralWords')).toBe('string_contains_several_words');
    expect(camelToSnake('stringWithSeveralUpperCaseLettersInROW')).toBe(
      'string_with_several_upper_case_letters_in_row'
    );
  });
});

describe('camelToSnakeObject', () => {
  test('converting object properties from camelCase to snake_case', () => {
    expect(
      camelToSnakeObject({
        simpleCase: true,
        moreDifficultCase: 'bar',
        aFewUpperCaseLettersInROW: 999
      })
    ).toEqual({
      simple_case: true,
      more_difficult_case: 'bar',
      a_few_upper_case_letters_in_row: 999
    });
  });
});
