#!/usr/bin/env node
import { auth } from '../index.js';
import { question } from './question.js';

let { YANDEX_CLIENT_ID: CLIENT_ID, YANDEX_CLIENT_SECRET: CLIENT_SECRET, REDIRECT_URI } = process.env;

console.log('Yandex OAuth token CLI\n');

// if (!CLIENT_ID) {
//   CLIENT_ID = await question('Enter ClientID: ');
// }

// if (!CLIENT_SECRET) {
//   CLIENT_SECRET = await question('Enter Client secret: ');
// }

// const obtainTokenAutomatically = (await question('Obtain token automatically? (y/n): ')) === 'y';

// if (obtainTokenAutomatically && !REDIRECT_URI) {
//   REDIRECT_URI =
//     (await question('Enter Redirect URI (default https://oauth.yandex.ru/verification_code): ')) ||
//     'https://oauth.yandex.ru/verification_code';
// }

// const token = await auth(
//   CLIENT_ID,
//   CLIENT_SECRET,
//   {
//     redirectURI: REDIRECT_URI
//   },
//   false,
//   obtainTokenAutomatically
// );

// process.stdout.write(`\nAccess token: ${token.access_token}
// Expiration date: ${new Date(Date.now() + token.expires_in * 1000).toLocaleString()}
// Refresh token: ${token.refresh_token}\n`);
