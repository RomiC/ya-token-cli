#!/usr/bin/env node

import { auth } from './index.js';

// Obtain these from https://oauth.yandex.ru
const CLIENT_ID = '<your-client-id>';
const CLIENT_SECRET = '<your-client-secret>';
const REDIRECT_URI = 'http://localhost:8899';

const token = await auth(CLIENT_ID, CLIENT_SECRET, { redirectURI: REDIRECT_URI });

console.log(token);
