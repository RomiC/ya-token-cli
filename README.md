# ya-token-cli [![NPM version](https://img.shields.io/npm/v/ya-token-cli.svg?style=flat-square)](https://www.npmjs.com/package/ya-token-cli) ![Tests](https://github.com/RomiC/ya-token-cli/workflows/Tests/badge.svg) [![Coverage Status](https://coveralls.io/repos/github/RomiC/ya-token-cli/badge.svg?branch=main)](https://coveralls.io/github/RomiC/ya-token-cli?branch=main)

This library contains some utilities to obtain Yandex OAuth token for CLI utilities. The process of [getting token](https://yandex.ru/dev/id/doc/en/codes/screen-code) consists of two steps:

1. Obtain confirmation code.
2. Exchange confirmation code to a token.

## Prerequisites

### Creating app

Skip this step if you've already had one. Create an app as described in the [documentation](https://yandex.ru/dev/id/doc/en/register-client).

### Configuring app

To make possible to authorize your console application, you need to set the [redirect URI](https://yandex.ru/dev/id/doc/en/register-client#platforms). To add it, go to the application parameters page and add the following URIs:

- https://oauth.yandex.ru/verification_code - used when the user enters confirmation code manually
- http://localhost:8899 - to obtain a confirmation code automatically

Now your app is ready to authorize.

## Authorization flow

To authorize your app, add the following code to it:

```js
import { auth } from 'ya-token-cli';

const CLIENT_ID = '<your-app-client-id>'; // can be obtained from application details page
const CLIENT_SECRET = '<your-app-client-secret>'; // see application details page
const REDIRECT_URI = 'http://localhost:8899/'; // Use the free port

const token = await auth(CLIENT_ID, CLIENT_SECRET, { redirectUri: REDIRECT_URI });
console.log(token);
```

When running, app first will display the URL, which the user should open in the browser:

```sh
Visit https://clck.ru/33qdQc
```

The next string will inform the user, that an additional server started:

```sh
Server listening on port 8899
```

This server will handle the redirect, which happens after the user has been successfully authorized. In the next step, the confirmation code will be exchanged to OAuth-token and returned to the app. The token has the following fields:

```json
{
  "access_token": "9q8uhfp9q83h4faushdfgioaw349-osaiudhfiasuh", // Token itself
  "expires_in": 31529249, // Expiration period in seconds
  "refresh_token": "d09j1f0i8ashjdfahjflakjwefa-wejflakwjeflk", // Refresh token
  "token_type": "bearer" // Token type
}
```

## API

### `auth(clientID, clientSecret, [clientOptions={}], [niceUrl=true], [obtainCodeAutomatically=true]): Promise<object>`

This is an all-in-one method to obtain the OAuth token. It will run the whole workflow and return the OAuth data.

#### Parameters

- `clientID` {string} - Application Client ID. You may find it on the application details page.
- `clientSecret` {string} - Necessary to exchange the confirmation token to OAuth-token.
- `[clientOptions={}]` {object} - [Optional] Additional properties could be specified. See optional parameters [here](https://yandex.ru/dev/id/doc/en/codes/screen-code#code-request).
  ⚠️ If you set `obtainCodeAutomatically` to true, you must provide `clientOptions.redirectURI`,
  which should be equal the local one set in the [configuration section](#configuring-app)
- `[niceUrl=true]` {boolean} - [Optional] Make verification URL shorter using clck.ru service.
- `[obtainCodeAutomatically=true]` {boolean} - [Optional] Automatically obtain verification code. Otherwise, the user will have to enter this code manually.

#### Example

```js
import { auth } from 'ya-token-cli';

// Visit https://oauth.yandex.ru to get the Client ID and Secret
const clientID = '74a00000000000000000000000000a06';
const clientSecret = 'ee000000000000000000000000000013';

const { access_token } = await auth(clientID, clientSecret, {
  redirectURI: 'http://localhost:8899' // required to obtain confirmation code automatically
});

console.log(access_token);
```

### `getConfirmationCodeUrl(clientID, [clientOptions={}]): string`

Created the URL to obtain confirmation code. The user should open this link, authorize himself and grant permissions to the application.

#### Parameters

- `clientID` {string} - Application Client ID. You may find it on the application details page.
- `[clientOptions={}]` - [Optional] Additional options could be specified. See full list [here](https://yandex.ru/dev/id/doc/en/codes/screen-code#code-request).

#### Example

```js
import { getConfirmationCodeUrl } from 'ya-token-cli/lib/confirmationCode.js';

// Visit https://oauth.yandex.ru to get the Client ID and Secret
const clientID = '74a00000000000000000000000000a06';

const confirmationCodeUrl = getConfirmationCodeUrl(clientID, {
  redirectURI: 'http://localhost:8899'
});

console.log(confirmationCodeUrl); // https://oauth.yandex.ru/authorize?client_id=74a00000000000000000000000000a06&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8899
```

### `readConfirmationCodeAutomatically(redirectURI): Promise<string>`

Run local web-server, to handle Yandex OAuth redirect and extract code from it. Return the Promise to be resolved with obtained code or rejected when code wasn't retrieved. The server will be down after the first request, no matter the result.

#### Parameters

- `redirectURI` {string} - Redirect URI used for authorization. Better be the local one.
  The web-server will run on 0.0.0.0 address using the port from the `redirectURI` parameter.

#### Example

```js
import { readConfirmationCodeAutomatically } from 'ya-token-cli/lib/confirmationCode.js';

// Visit https://oauth.yandex.ru/ to configure redirectURI of your app
const confirmationCode = await readConfirmationCodeAutomatically('http://localhost:8899');

console.log(confirmationCode); // 398672
```

### `readConfirmationCode([title]): Promise<string>`

Will expect a confirmation code from the user to be entered in the terminal.

#### Parameters

- `[title='Enter confirmation code: ']` {string} - The message to be displayed in the terminal.

#### Example

```js
import { readConfirmationCode } from 'ya-token-cli/lib/confirmationCode.js';

// Visit https://oauth.yandex.ru/ to set redirectURI for your app to 'https://oauth.yandex.ru/verification_code'
const confirmationCode = await readConfirmationCode();

console.log(confirmationCode); // 398672
```

### `exchange(clientID, clientSecret, confirmationCode): Promise<>`

Will expect a confirmation code from the user to be entered in the terminal.

#### Parameters

- `[title='Enter confirmation code: ']` {string} - The message to be displayed in the terminal.

#### Example

```js
import { exchange } from 'ya-token-cli/lib/token.js';

// Visit https://oauth.yandex.ru/ to set redirectURI for your app to 'https://oauth.yandex.ru/verification_code'
const confirmationCode = await readConfirmationCode();

console.log(confirmationCode); // 398672
```
