import Defer from '../lib/defer';

test('should be a class', () => {
  expect(new Defer()).toBeInstanceOf(Defer);
});
