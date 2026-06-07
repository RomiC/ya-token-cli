/**
 * Simple request function
 * @param {string} url URL to request
 * @param {object} [options={}] Additional parameters
 * @param {boolean} [options.asJson=true] Whether to return the response as JSON
 * @param {object} [options.headers={}] Additional headers
 * @param {('GET'|'POST')} [options.method='GET'] HTTP method
 * @param {object} [options.params=null] List of query parameters
 * @param {any} [body=null] Request body
 */
export async function request(url, options = {}, body = null) {
  const { asJson = true, headers = {}, method = 'GET', params = null } = options;

  const response = await fetch(params != null ? `${url}?${new URLSearchParams(params)}` : url, {
    method,
    headers,
    body
  });

  const data = asJson ? await response.json() : await response.text();

  if (response.ok) {
    return data;
  }

  const err = new Error(data.error_description || 'Unknown error');
  err.name = response.status;
  throw err;
}
