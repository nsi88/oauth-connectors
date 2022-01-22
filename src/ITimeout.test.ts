import { implementsITimeout } from './ITimeout';

describe('implementsITimeout', () => {
  test.each([
    [undefined, false],
    [1, false],
    [{}, false],
    [{a: 1}, false],
    [{timeout: 'string'}, false],
    [{timeout: 1, something: 'something'}, true],
  ])('is correct', (object: any, outcome: boolean) => {
    expect(implementsITimeout(object)).toStrictEqual(outcome);
  });
});
