/**
 * Convert string from camelCase to snake_case
 * @param {string} camelCase Input string in camelCase
 * @returns {string} In snake_case
 */
export function camelToSnake(camelCase) {
  return camelCase.replace(/([a-z])([A-Z]([A-Z]+)?)/g, (_, small, capital) => `${small}_${capital.toLowerCase()}`);
}

/**
 * Convert object properties from camelCase to snake_case
 * @param {object} object Object to convert
 * @returns {object} Converted object
 */
export function camelToSnakeObject(object) {
  return Object.keys(object).reduce((result, key) => {
    result[camelToSnake(key)] = object[key];

    return result;
  }, {});
}
