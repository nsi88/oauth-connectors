import Github from './Github';
import IOAuth2AccessTokenRequest from './IOAuth2AccessTokenRequest';
import { exchangeWebFlowCode } from '@octokit/oauth-methods';
import {
  OAuthAppAuthentication,
  OAuthAppCreateTokenResponseData,
} from '@octokit/oauth-methods/dist-types/types';

jest.mock('@octokit/oauth-methods');

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

describe('accessTokenRequest', () => {
  // Add .only to describe to make the test run
  describe('half manual', () => {
    beforeEach(() => {
      const { exchangeWebFlowCode: actualExchangeWebFlowCode } = jest.requireActual('@octokit/oauth-methods');
      (exchangeWebFlowCode as jest.Mock).mockImplementation(actualExchangeWebFlowCode);
    });

    test('returns an access token', async () => {
      // Get code when redirected from
      // https://github.com/login/oauth/authorize?client_id=82dea1130e1b7f25421a&scope=repo%20read:discussion%20read:user
      const code = 'aaaaaaaaaaaa';

      // process.env is initialized in jest.config.js
      const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
      expect(clientId).not.toBeUndefined();
      const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;
      expect(clientSecret).not.toBeUndefined();
      const redirectUrl = process.env.OAUTH_GITHUB_AUTHORIZATION_CALLBACK_URL;
      expect(redirectUrl).not.toBeUndefined();

      const github = new Github(Github.DEFAULT_ORIGIN, clientSecret);
      const oAuth2AccessTokenResponse = await github.accessTokenRequest({
        grantType: 'authorization_code',
        code,
        redirectUri: redirectUrl as string,
        clientId: clientId as string,
      });
      expect(oAuth2AccessTokenResponse.accessToken).not.toEqual('');
      expect(oAuth2AccessTokenResponse.tokenType).toEqual('bearer');
      // Granting access to more than one repo gives the same result.
      expect(oAuth2AccessTokenResponse.scope).toStrictEqual(['read:discussion,repo']);
      expect(oAuth2AccessTokenResponse.refreshToken).toBeNull();
      expect(oAuth2AccessTokenResponse.expiresIn).toBeNull();
    });
  });

  // .only is used to skip the half manual test above
  describe.only('automatic', () => {
    describe('with invalid grantType', () => {
      const github = new Github(Github.DEFAULT_ORIGIN, 'secret');
      const oAuth2AccessTokenRequest: IOAuth2AccessTokenRequest = {
        grantType: 'not_authorization_code',
        code: 'code',
        redirectUri: 'redirectUri',
        clientId: 'clientId',
      };

      test('throws an error', async () => {
        await expect(() => github.accessTokenRequest(oAuth2AccessTokenRequest)).rejects
          .toThrow('grantType value MUST be set to "authorization_code"');
      });
    });

    describe('without secret', () => {
      const github = new Github(Github.DEFAULT_ORIGIN, undefined);
      const oAuth2AccessTokenRequest: IOAuth2AccessTokenRequest = {
        grantType: 'authorization_code',
        code: 'code',
        redirectUri: 'redirectUri',
        clientId: 'clientId',
      };

      test('throws an error', async () => {
        await expect(() => github.accessTokenRequest(oAuth2AccessTokenRequest)).rejects
          .toThrow('clientSecret should be setup');
      });
    });

    describe('when exchangeWebFlowCode throws an error', () => {
      const error = new Error('HttpError: The code passed is incorrect or expired');

      beforeEach(() => {
        (exchangeWebFlowCode as jest.Mock).mockImplementation(async () => { throw error; });
      });

      test('rethrows the error', async () => {
        const github = new Github(Github.DEFAULT_ORIGIN, 'secret');
        const oAuth2AccessTokenRequest: IOAuth2AccessTokenRequest = {
          grantType: 'authorization_code',
          code: 'code',
          redirectUri: 'redirectUri',
          clientId: 'clientId',
        };
        await expect(() => github.accessTokenRequest(oAuth2AccessTokenRequest)).rejects.toThrow(error);
      });
    });

    describe('when exchangeWebFlowCode returns a valid result', () => {
      const accessToken = 'aaa_aaaaaaaaaaaaaaaaaaa';
      const data: OAuthAppCreateTokenResponseData = {
        'access_token': accessToken,
        'token_type': 'bearer',
        'scope': '',
      };
      const authentication: OAuthAppAuthentication = {
        'clientType': 'oauth-app',
        'clientId': 'aaaaaaaaaaaaa',
        'clientSecret': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'token': accessToken,
        'scopes': [],
      };

      beforeEach(() => {
        (exchangeWebFlowCode as jest.Mock).mockReturnValue({ data, authentication });
      });

      test('returns valid IOAuth2AccessTokenResponse', async () => {
        const github = new Github(Github.DEFAULT_ORIGIN, 'secret');
        const oAuth2AccessTokenRequest: IOAuth2AccessTokenRequest = {
          grantType: 'authorization_code',
          code: 'code',
          redirectUri: 'redirectUri',
          clientId: 'clientId',
        };
        await expect(github.accessTokenRequest(oAuth2AccessTokenRequest)).resolves.toStrictEqual({
          accessToken,
          tokenType: 'bearer',
          scope: [],
          expiresIn: null,
          refreshToken: null,
        });
      });
    });
  });
});

function randomString(): string {
  return Math.random().toString(36).substring(7);
}
