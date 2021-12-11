import parseScope from './parseScope';

describe('parseScope', () => {
  test.each([' ', 'repo, read:discussion'])('invalid scope', scope => {
    expect(() => parseScope(scope)).toThrow(scope);
  });

  test.each([
    ['', []],
    ['repo,read:discussion', ['repo', 'read:discussion']],
    ['whatever:trust,github', ['whatever:trust', 'github']],
  ])('valid scope', (input, output) => {
    expect(parseScope(input)).toStrictEqual(output);
  });
});
