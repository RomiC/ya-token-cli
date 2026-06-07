import readline from 'node:readline/promises';
import { afterEach, beforeEach, mock } from 'node:test';

class ReadlineQuestionMock {
  constructor(title, resolve) {
    this._title = title;
    this._resolve = resolve;
  }

  _answer(text) {
    this._resolve(text);
  }
}

class ReadlineInterfaceMock {
  _questions = [];

  constructor(input, output) {
    this._input = input;
    this._output = output;
  }

  question = (title) => {
    const { promise, resolve } = Promise.withResolvers();
    this._questions.push(new ReadlineQuestionMock(title, resolve));
    return promise;
  };

  close = () => {};

  get _lastQuestion() {
    return this._questions[this._questions.length - 1];
  }
}

class ReadlineMock {
  _interfaces = [];

  createInterface = ({ input, output } = {}) => {
    this._interfaces.push(new ReadlineInterfaceMock(input, output));
    return this._lastInterface;
  };

  get _lastInterface() {
    return this._interfaces[this._interfaces.length - 1];
  }

  _resetMock() {
    this._interfaces = [];
  }
}

export const readlineMock = new ReadlineMock();

/**
 * Register beforeEach/afterEach hooks that stub and restore readline.createInterface.
 * Call at the top level of each spec file or describe block that needs readline mocking.
 */
export function useReadlineMock() {
  beforeEach(() => {
    readlineMock._resetMock();
    mock.method(readline, 'createInterface', readlineMock.createInterface.bind(readlineMock));
  });
  afterEach(() => mock.restoreAll());
}
