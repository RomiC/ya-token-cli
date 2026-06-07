import { vi } from 'vitest';

function createReadlineModuleMock() {
  return new ReadlineMock();
}

class ReadlineMock {
  _interfaces = [];

  createInterface = vi.fn().mockImplementation(({ input, output }) => {
    this._interfaces.push(new ReadlineInterfaceMock(input, output));

    return this._lastInterface;
  });

  get _lastInterface() {
    return this._interfaces[this._interfaces.length - 1];
  }

  _resetMock() {
    this._interfaces = [];
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

class ReadlineQuestionMock {
  constructor(title, resolve) {
    this._title = title;
    this._resolve = resolve;
  }

  _answer(text) {
    this._resolve(text);
  }
}

export default createReadlineModuleMock();
