import https from 'node:https';
import querystring from 'node:querystring';

import Defer from './defer.js';

/**
 * Simple request function
 * @param {string} url URL to request
 * @param {object} [options={}] Additional parameters
 * @param {boolean} [options.asJson=true] Whether to return the response as JSON
 * @param {object} [options.headers={}] Additional headers
 * @param {('GET'|'POST')} [options.method='GET'] HTTP method
 * @param {object} [options.params=null] List of query parameters
 * @param {any} [data=null] Data to send
 */
export async function request(url, options = {}, data = null) {
  const { promise, resolve, reject } = new Defer();

  const { asJson = true, headers = {}, method = 'GET', params = null } = options;

  const req = https.request(
    url + (params != null ? `?${querystring.stringify(params)}` : ''),
    {
      method,
      headers
    },
    (res) => {
      let data = '';
      const { statusCode } = res;

      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsedResponse = asJson ? JSON.parse(data) : data;

          if (statusCode === 200) {
            resolve(parsedResponse);
          } else {
            const err = new Error(parsedResponse.error_description || 'Unknown error');
            err.name = statusCode;
            throw err;
          }
        } catch (err) {
          reject(err);
        }
      });
    }
  );

  req.on('error', reject);
  if (data != null) {
    req.write(data.toString('utf8'));
  }
  req.end();

  return promise;
}
