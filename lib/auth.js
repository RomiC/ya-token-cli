import { shortenUrl } from './clck.js';
import { getConfirmationCodeUrl, readConfirmationCode, readConfirmationCodeAutomatically } from './confirmationCode.js';
import { exchange } from './token.js';

/**
 * @typedef {import('./confirmationCode.js').YandexClientOptions} YandexClientOptions
 * @typedef {import('./token.js').YandexTokenData} YandexTokenData
 */

/**
 * Function to authorize the app
 * @param {string} clientID Application ID. Available in the app properties. To open properties, go to Yandex OAuth and click the app name.
 * @param {string} clientSecret Application secret used to exchange confirmation code to token
 * @param {YandexClientOptions} [clientOptions={}] Additional parameters
 * @param {boolean} [niceUrl=true] If true will short the URL using clck.ru service. Useful for the case when the user isn't able to copy the URL
 * @param {boolean} [obtainCodeAutomatically=true] If true will try to get confirmation code automatically, but requires options.redirectUri to be set
 * @returns {Promise<YandexTokenData>} Promise to be resolved with token data
 */
export async function auth(clientID, clientSecret, clientOptions, niceUrl = true, obtainCodeAutomatically = true) {
  const confirmationCodeUrl = getConfirmationCodeUrl(clientID, clientOptions);

  process.stdout.write(`Visit ${niceUrl ? await shortenUrl(confirmationCodeUrl) : confirmationCodeUrl}\n`);

  const confirmationCode = obtainCodeAutomatically
    ? await readConfirmationCodeAutomatically(clientOptions.redirectURI)
    : await readConfirmationCode();

  return await exchange(clientID, clientSecret, confirmationCode);
}
