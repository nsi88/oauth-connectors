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
      (exchangeWebFlowCode as jest.Mock).mockImplementation(async () => {
        throw error;
      });
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
      (exchangeWebFlowCode as jest.Mock).mockReturnValue({data, authentication});
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

function randomString(): string {
  return Math.random().toString(36).substring(7);
}
