import Github from './Github';
import * as assert from 'assert';
import IOAuth2AccessTokenResponse from './IOAuth2AccessTokenResponse';

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

// By default disabled. To long to run on every build
describe.skip('throttling', () => {
  const accessToken = process.env.OAUTH_GITHUB_ACCESS_TOKEN;
  assert(accessToken !== undefined);
  const tokenType = process.env.OAUTH_GITHUB_TOKEN_TYPE;
  assert(tokenType !== undefined);
  const scope = (process.env.OAUTH_GITHUB_SCOPE || '').split(',');
  const oAuth2AccessTokenResponse: IOAuth2AccessTokenResponse = {
    accessToken,
    tokenType,
    refreshToken: null,
    scope,
    expiresIn: null,
  };
  let error: Error | undefined = undefined;
  const github = new Github();

  beforeAll(() => {
    jest.setTimeout(5 * 60 * 1000);
  });

  describe('without retries and timeout', () => {
    beforeAll(async () => {
      error = undefined;
      try {
        for (let i = 0; i < 10; i++) {
          await github.search('10 football rules in:file repo:open-loocle/google-wikipediai-dataset', oAuth2AccessTokenResponse);
        }
      } catch (e) {
        error = e;
      }
    });

    test('error', () => {
      expect(error?.message).toContain('exceeded');
    });
  });

  describe('with retries without timeout', () => {
    beforeAll(async () => {
      error = undefined;
      try {
        for (let i = 0; i < 10; i++) {
          const results = await github.search(
            '10 football rules in:file repo:open-loocle/google-wikipediai-dataset',
            oAuth2AccessTokenResponse,
              { retries: 10 },
          );
          console.debug('results', results);
        }
      } catch (e) {
        error = e;
      }
    });

    test('error', () => {
      expect(error).toBeUndefined();
    });
  });
});
