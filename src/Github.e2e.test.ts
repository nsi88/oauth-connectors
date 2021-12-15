import Github from './Github';

describe('login and search', () => {
  // process.env is initialized in jest.config.js
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;
  const redirectUrl = process.env.OAUTH_GITHUB_AUTHORIZATION_CALLBACK_URL;
  // Get code when redirected from
  // https://github.com/login/oauth/authorize?client_id=82dea1130e1b7f25421a&scope=repo
  // and put into .env
  const code = process.env.OAUTH_GITHUB_CODE;

  test('', async () => {
    if (code === undefined) {
      console.debug('No code. Skipping the test');
      return;
    }
    expect(clientId).not.toBeUndefined();
    expect(clientSecret).not.toBeUndefined();
    expect(redirectUrl).not.toBeUndefined();

    const github = new Github(Github.DEFAULT_ORIGIN, clientSecret);
    const oAuth2AccessTokenResponse = await github.accessTokenRequest({
      grantType: 'authorization_code',
      code,
      redirectUri: redirectUrl as string,
      clientId: clientId as string,
    });
    const searchResults = await github.search('OAuth', oAuth2AccessTokenResponse);
    console.debug(searchResults);
  });
});
