#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config();

import { auth } from './index.js';

const { YANDEX_CLIENT_ID, YANDEX_CLIENT_SECRET } = process.env;

const token = await auth(YANDEX_CLIENT_ID, YANDEX_CLIENT_SECRET, { redirectURI: 'http://localhost:8899' });

console.log(token);
