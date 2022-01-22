import { implementsIRetries } from './IRetries';

describe('implementsIRetries', () => {
  test.each([
    [undefined, false],
    [1, false],
    [{}, false],
    [{a: 1}, false],
    [{retries: 'string'}, false],
    [{retries: 1, something: 'something'}, true],
  ])('is correct', (object: any, outcome: boolean) => {
    expect(implementsIRetries(object)).toStrictEqual(outcome);
  });
});
