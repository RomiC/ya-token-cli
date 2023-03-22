import { request } from './request.js';
import { CLCK_API_URL } from './constants.js';

/**
 * Create short URL
 * @see {@link https://clck.ru API link at the bottom}
 *
 * @param {string} url URL to shorten
 * @return {Promise<string>} Shorted URL
 */
export async function shortenUrl(url) {
  return await request(CLCK_API_URL, { asJson: false, params: { url } });
}
