#!/usr/bin/env node
import { auth } from './index.js';
import * as dotenv from 'dotenv';

const { CLIENT_ID = process.env.CLIENT_ID, CLIENT_SECRET = process.env.CLIENT_SECRET } = dotenv.config();

const token = await auth(
  CLIENT_ID,
  CLIENT_SECRET,
  {
    redirectURI: 'http://localhost:7890/'
  },
  false
);

process.stdout.write(`TOKEN: ${JSON.stringify(token, null, 2)}\n`);
