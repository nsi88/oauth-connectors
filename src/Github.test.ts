import Github from './Github';

const clientId = 'aaaaaaaaaaaaaaa';

describe('authorizationRequest', () => {
  test('with invalid responseType', () => {
    const github = new Github();
    expect(() => {
      github.authorizationRequest({
        responseType: 'not_code',
        clientId,
        redirectUri: null,
        scope: null,
        state: null,
      });
    }).toThrow('responseType value MUST be set to "code"');
  });

  test.each([null, 'https://github.yourdomain.net'])('with valid params', origin => {
    const github = origin === null ? new Github() : new Github(origin);
    const state = randomString();
    expect(
        github.authorizationRequest({
          responseType: 'code',
          clientId,
          redirectUri: 'http://localhost:8000',
          // See https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps
          scope: ['repo'],
          state,
        }),
    ).toStrictEqual(new URL(
        `${origin || Github.DEFAULT_ORIGIN}/login/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=http%3A%2F%2Flocalhost%3A8000&scope=repo&state=${state}`,
    ));
  });
});

function randomString(): string {
  return Math.random().toString(36).substring(7);
}
