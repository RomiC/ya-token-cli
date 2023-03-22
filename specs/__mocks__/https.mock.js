import { EventEmitter } from 'node:events';

function createHttpModuleMock() {
  const _requests = [];

  const mockInstance = {
    request(url, options, callback) {
      return _requests[_requests.push(new HttpRequestMock(url, options, callback)) - 1];
    },
    get _lastRequest() {
      return _requests[_requests.length - 1];
    }
  };

  return mockInstance;
}

class HttpRequestMock extends EventEmitter {
  _isSent = false;

  constructor(url, options, successCallback) {
    super();

    this._context = {
      url,
      options
    };
    this._successCallback = successCallback;
    this._isSent = false;
  }

  write(data) {
    this._sentData = data;
  }

  end() {
    this._isSent = true;
  }

  _respondWith(status, data = '') {
    if (typeof this._successCallback === 'function') {
      const responseMock = new HttpResponseMock(status, data);
      this._successCallback(responseMock);
      responseMock._respond();
    }
  }

  _triggerError(error) {
    this.emit('error', error);
  }
}

class HttpResponseMock extends EventEmitter {
  constructor(statusCode, data = '') {
    super();

    this.statusCode = statusCode;
    this._data = data;
  }

  _respond() {
    if (!!this._data) {
      this.emit('data', this._data.toString());
    }

    this.emit('end');
  }
}

export default createHttpModuleMock();
