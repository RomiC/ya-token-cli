import { Buffer } from 'node:buffer';
import querystring from 'node:querystring';

import { request } from './request.js';
import { YANDEX_OAUTH_TOKEN_URL } from './constants.js';

/**
 * Yandex OAuth token data
 * @see {@link https://yandex.ru/dev/id/doc/en/codes/screen-code#token-response Token data description}
 * @typedef {Object} YandexTokenData
 * @property {('bearer')} token_type Type of token issued. Always takes the bearer value.
 * @property {string} access_token An OAuth token with the requested rights or with the rights
 *                                 specified when registering the app.
 * @property {string} expires_in Token lifetime in seconds.
 * @property {string} refresh_token A token that can be used to extend the lifetime of the corresponding OAuth token.
 *                                  The lifetime of the refresh token is the same as the OAuth token lifetime.
 * @property {string} [scope] The rights requested by the developer or specified when registering the app.
 *                            The scope field is optional and is returned if OAuth provided a token
 *                            with a smaller set of rights than requested.
 */

/**
 * Function to exchange confirmation code to OAuth token
 * @see {@link https://yandex.ru/dev/id/doc/en/codes/screen-code#token Exchanging a confirmation code for an OAuth token}
 *
 * @param {string} clientID Application Client ID
 * @param {string} clientSecret Application Secret ID
 * @param {string} confirmationCode Confirmation code got from the user
 * @returns {Promise<YandexTokenData>} OAuth token
 */
export async function exchange(clientID, clientSecret, confirmationCode) {
  const data = Buffer.from(
    querystring.stringify({
      grant_type: 'authorization_code',
      code: confirmationCode
    })
  );
  const authHeader = `Basic ${Buffer.from(`${clientID}:${clientSecret}`).toString('base64')}`;

  return await request(
    YANDEX_OAUTH_TOKEN_URL,
    {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length
      }
    },
    data
  );
}
