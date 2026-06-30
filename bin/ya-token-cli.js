#!/usr/bin/env node

import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { Command } from 'commander';
import { auth } from '../index.js';

/**
 * Prompt user for input via stdin/stdout.
 * Exported for testability.
 * @param {import('node:readline/promises').Interface} rl - readline interface
 * @param {string} question - prompt text
 * @param {string} [defaultValue] - optional default value
 * @returns {Promise<string>}
 */
export async function prompt(rl, question, defaultValue) {
  const text = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
  const answer = await rl.question(text);
  return answer.trim() || defaultValue || '';
}

/**
 * Validate that a required value is present, exiting with an error if not.
 * @param {string} value
 * @param {string} label - human-readable label for the error message
 * @returns {string}
 */
function requireValue(value, label) {
  if (!value) {
    console.error(
      `Error: ${label} is required. Provide it via --${label.toLowerCase().replace(/ /g, '-')} flag or ${label.toUpperCase().replace(/ /g, '_')} environment variable.`
    );
    process.exit(1);
  }
  return value;
}

/**
 * Main CLI logic.
 * @param {string[]} [args] - command-line arguments (defaults to process.argv)
 */
export async function main(args = process.argv) {
  const program = new Command();

  program
    .name('ya-token-cli')
    .description('Obtain a Yandex OAuth token via interactive CLI')
    .option('-i, --client-id <id>', 'Yandex OAuth client ID')
    .option('-s, --client-secret <secret>', 'Yandex OAuth client secret')
    .option('-r, --redirect-uri <uri>', 'Redirect URI for automatic flow')
    .option('-m, --manual', 'Skip automatic redirect, prompt for code manually')
    .option('-u, --short-url', 'Shorten the auth URL using clck.ru', false)
    .exitOverride()
    .showHelpAfterError();

  try {
    program.parse(args);
  } catch (error) {
    // Commander throws on --help (exitCode=0) or unknown options (exitCode=1)
    process.exit(error.exitCode ?? 1);
    return;
  }

  const opts = program.opts();

  // Gather values: flag > env > interactive prompt
  let clientId = opts.clientId || process.env.YANDEX_CLIENT_ID;
  let clientSecret = opts.clientSecret || process.env.YANDEX_CLIENT_SECRET;
  let redirectUri = opts.redirectUri || process.env.REDIRECT_URI;
  const useManual = opts.manual || false;
  const useShortUrl = opts.shortUrl || false;

  // Interactive prompts for missing values
  let obtainAutomatically = !useManual;

  const needsPrompts =
    !clientId ||
    !clientSecret ||
    (obtainAutomatically && !redirectUri) ||
    (opts.manual === undefined && opts.redirectUri === undefined);

  if (needsPrompts) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    try {
      if (!clientId) {
        clientId = await prompt(rl, 'Enter Yandex Client ID');
      }

      if (!clientSecret) {
        clientSecret = await prompt(rl, 'Enter Yandex Client Secret');
      }

      // Only ask about mode if neither --manual nor --redirect-uri was explicitly provided
      if (opts.manual === undefined && opts.redirectUri === undefined) {
        const modeAnswer = await prompt(rl, 'Obtain token automatically via redirect?', 'Y');
        obtainAutomatically = modeAnswer.toLowerCase() !== 'n';
      }

      if (obtainAutomatically && !redirectUri) {
        redirectUri = await prompt(rl, 'Enter Redirect URI', 'http://localhost:8899');
      }
    } finally {
      rl.close();
    }
  }

  // Validate required values
  clientId = requireValue(clientId, 'client-id');
  clientSecret = requireValue(clientSecret, 'client-secret');

  const clientOptions = {};
  if (redirectUri) {
    clientOptions.redirectURI = redirectUri;
  }

  try {
    const tokenData = await auth(clientId, clientSecret, clientOptions, useShortUrl, obtainAutomatically);
    console.log('\n=== Token obtained successfully ===');
    console.log(tokenData);
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

// Auto-run only when executed as the entry point
// Resolve symlinks so global `npm i -g ./` symlinks still trigger the guard
const entryPath = process.argv[1] ? realpathSync(process.argv[1]) : null;
const modulePath = realpathSync(fileURLToPath(import.meta.url));
if (entryPath === modulePath) {
  main();
}
