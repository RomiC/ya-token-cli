import http from 'node:http';
import querystring from 'node:querystring';
import readline from 'node:readline';

import { camelToSnakeObject } from './camelToSnake.js';
import { YANDEX_OAUTH_VERIFICATION_URL } from './constants.js';
import Defer from './defer.js';

/**
 * Yandex Client options
 * @see {@link https://yandex.ru/dev/id/doc/en/codes/screen-code#code-request More details}
 * @typedef {Object} YandexClientOptions
 * @property {string} [deviceID=''] Unique ID of the device the token is requested for. The ID must be from 6 to 50 characters long. Only printable ASCII characters are allowed (with codes from 32 to 126).
 * @property {string} [deviceName=''] The name of the device to show users. Up to 100 characters.
 * @property {string} [redirectURI=''] The URL to redirect the user to after they allow access to the app. By default, the first Redirect URI specified in the (Platforms → Web services → Redirect URI) app settings is used.
 * @property {string} [loginHint=''] Explicit indication of the account the token is requested for. The Yandex account username and the Yandex Mail or Yandex Mail for Domain address can be passed in the parameter value.
 * @property {string} [scope=''] List of the access rights the app requires. Values in the list are separated by commas.
 * @property {string} [optionalScope] Optional rights are requested in addition to the rights specified in the scope parameter.
 * @property {boolean} [forceConfirm=false] Indicates that permission to access the account must be requested (even if the user already allowed access to this app). After receiving this parameter, Yandex OAuth will prompt the user to allow access to the app and choose the Yandex account.
 * @property {string} [state=''] The status bar that Yandex OAuth returns without changes. The maximum allowed string length is 1024 characters. Can be used, for example, to protect against CSRF attacks or identify the user the token is requested for.
 */

/**
 * Function returns the URL to get the confirmation code
 * @see {@link https://yandex.ru/dev/id/doc/en/codes/screen-code#code Confirmation code request}
 *
 * @param {string} clientID Application ID. Available in the app properties. To open properties, go to Yandex OAuth and click the app name.
 * @param {YandexClientOptions} [clientOptions={}] Additional parameters
 * @return {string}
 */
export function getConfirmationCodeUrl(clientID, clientOptions = {}) {
  return (
    YANDEX_OAUTH_VERIFICATION_URL +
    '?' +
    querystring.stringify(
      camelToSnakeObject({
        clientID,
        responseType: 'code',
        ...clientOptions
      })
    )
  );
}

/**
 * Function runs web-server, which will handle redirect from Yandex OAuth
 * @param {string} redirectURI URL redirect which configured for app
 * @returns {Promise<string>} Confirmation code returned by Yandex OAuth
 */
export function readConfirmationCodeAutomatically(redirectURI) {
  const redirectUrl = new URL(redirectURI);
  const { promise, resolve, reject } = new Defer();

  const connectionPull = new Set();

  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url, redirectUrl.origin);
    const code = requestUrl.searchParams.get('code');

    if (!!code) {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(
        '<!doctype html><title>Saving the code…</title><body><p>We got the code! The window will be close in 3s</p><script>setTimeout(() => window.close(), 3000)</script></body>'
      );
    } else {
      response.writeHead(400, {
        'Content-Type': 'text/plain; charset=utf-8'
      });
      response.end("Something went wrong! We didn't get the confirmation code");
    }

    server.close(() => {
      if (!!code) {
        resolve(code);
      } else {
        reject(new Error("Confirmation code wasn't returned!"));
      }
    });

    connectionPull.forEach((socket) => socket.destroy());
  });
  server.on('connection', (socket) => connectionPull.add(socket));
  server.listen(redirectUrl.port, () => process.stdout.write(`Server listening on port ${redirectUrl.port}\n`));

  return promise;
}

/**
 * Function to request confirmation code from user
 * @param {string} [title] Message to show the user
 * @return {Promise<string>} Code
 */
export function readConfirmationCode(title = 'Enter confirmation code: ') {
  const { promise, resolve } = new Defer();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question(title, (code) => {
    rl.close();
    resolve(code);
  });

  return promise;
}
