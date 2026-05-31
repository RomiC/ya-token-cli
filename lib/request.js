import querystring from 'node:querystring';

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
  const { asJson = true, headers = {}, method = 'GET', params = null } = options;

  const response = await fetch(url + (params != null ? `?${querystring.stringify(params)}` : ''), {
    method,
    headers,
    ...(data != null ? { body: data } : {})
  });
  const responseData = await response.text();
  const parsedResponse = asJson ? JSON.parse(responseData) : responseData;

  if (response.status === 200) {
    return parsedResponse;
  }

  const err = new Error(parsedResponse.error_description || 'Unknown error');
  err.name = response.status;
  throw err;
}
