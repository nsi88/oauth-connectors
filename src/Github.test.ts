import Github from './Github';
import IOAuth2AccessTokenRequest from './IOAuth2AccessTokenRequest';
import { exchangeWebFlowCode } from '@octokit/oauth-methods';
import {
  OAuthAppAuthentication,
  OAuthAppCreateTokenResponseData,
} from '@octokit/oauth-methods/dist-types/types';
import ConnectorError from './ConnectorError';
import IOAuth2AccessTokenResponse from './IOAuth2AccessTokenResponse';
import HttpStatusCodeConnectorError from './HttpStatusCodeConnectorError';
import SearchResult from './SearchResult';
const fetchMock = require('fetch-mock-jest');
const searchResponseBody = require('./Github.test/searchResponseBody.json');

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

describe('search', () => {
  describe('when oAuth2AccessTokenResponse is null', () => {
    test('throws ConnectorError', async () => {
      const github = new Github();
      await expect(github.search('test', null)).rejects
        .toThrow(new ConnectorError(github, 'oAuth2AccessTokenResponse is required'));
    });
  });

  describe('when oAuth2AccessTokenResponse has an invalid format', () => {
    test('throws Error', async () => {
      const github = new Github();
      await expect(github.search('test', {a: 1})).rejects
        .toThrow('accessToken is required');
    });
  });

  const oAuth2AccessTokenResponse: IOAuth2AccessTokenResponse = {
    accessToken: 'gho_aaaaaaaaaaaaaaaaaaaaaa',
    tokenType: 'bearer',
    scope: ['repo'],
    expiresIn: null,
    refreshToken: null,
  };

  // See https://docs.github.com/en/rest/reference/search#search-code
  // for possible responses
  describe('when Github responds with 304', () => {
    const query = 'OAuth';
    const fetch = fetchMock.sandbox().getOnce({
      url: `https://api.github.com/search/code?q=${query}`,
      headers: {
        accept: 'application/vnd.github.v3.text-match+json',
      },
    }, { status: 304 });
    const github = new Github(Github.DEFAULT_ORIGIN, undefined, fetch);

    test('throws HttpStatusCodeError', async () => {
      await expect(github.search(query, oAuth2AccessTokenResponse)).rejects
        .toThrow(new HttpStatusCodeConnectorError(304, expect.any(Github), 'Not modified'));
    });
  });

  describe('when Github responds with 403', () => {
    const query = 'OAuth';
    const fetch = fetchMock.sandbox().getOnce({
      url: `https://api.github.com/search/code?q=${query}`,
      headers: {
        accept: 'application/vnd.github.v3.text-match+json',
      },
    }, {
      status: 403,
      // Haven't found a real example of 403 body.
      // Imagined one based on components["responses"]["forbidden"] type from @octokit/openapi-types
      body: {
        message: 'Forbidden',
        documentation_url: 'docs',
      },
    });
    const github = new Github(Github.DEFAULT_ORIGIN, undefined, fetch);

    test('throws HttpStatusCodeError', async () => {
      await expect(github.search(query, oAuth2AccessTokenResponse)).rejects
        .toThrow(new HttpStatusCodeConnectorError(403, expect.any(Github), 'Forbidden'));
    });
  });

  describe('when Github responds with 422', () => {
    const query = 'OAuth';
    const fetch = fetchMock.sandbox().getOnce({
      url: `https://api.github.com/search/code?q=${query}`,
      headers: {
        accept: 'application/vnd.github.v3.text-match+json',
      },
    }, {
      status: 422,
      body: {
        // The example is from https://github.com/octokit/fixtures/blob/74a18dbfb285e193b8f54a45f1bd6151edb6d372/scenarios/api.github.com/errors/raw-fixture.json
        message: 'Validation Failed',
        errors: [{ 'resource': 'Label', 'code': 'invalid', 'field': 'color' }],
        documentation_url: 'https://docs.github.com/rest/reference/issues#create-a-label',
      },
    });
    const github = new Github(Github.DEFAULT_ORIGIN, undefined, fetch);

    test('throws HttpStatusCodeError', async () => {
      await expect(github.search(query, oAuth2AccessTokenResponse)).rejects
        .toThrow(new HttpStatusCodeConnectorError(
            422,
            expect.any(Github),
            'Validation Failed: {"resource":"Label","code":"invalid","field":"color"}',
        ));
    });
  });

  describe('when Github responds with 503', () => {
    const query = 'OAuth';
    const fetch = fetchMock.sandbox().getOnce({
      url: `https://api.github.com/search/code?q=${query}`,
      headers: {
        accept: 'application/vnd.github.v3.text-match+json',
      },
    }, {
      status: 503,
      body: {
        message: 'Service unavailable',
      },
    });
    const github = new Github(Github.DEFAULT_ORIGIN, undefined, fetch);

    test('throws HttpStatusCodeError', async () => {
      await expect(github.search(query, oAuth2AccessTokenResponse)).rejects
      .toThrow(new HttpStatusCodeConnectorError(
          503,
          expect.any(Github),
          'Service unavailable',
      ));
    });
  });

  describe('when Github responds with 200', () => {
    const query = 'OAuth';
    const fetch = fetchMock.sandbox().getOnce({
      url: `https://api.github.com/search/code?q=${query}`,
      headers: {
        accept: 'application/vnd.github.v3.text-match+json',
      },
    }, {
      status: 200,
      body: searchResponseBody,
    });
    const github = new Github(Github.DEFAULT_ORIGIN, undefined, fetch);

    test('returns SearchResults', async () => {
      const searchResults = await github.search(query, oAuth2AccessTokenResponse);
      expect(searchResults.length).toStrictEqual(30);
      expect(searchResults[0]).toStrictEqual(new SearchResult(
          'https://api.github.com/repositories/247653425/git/blobs/7af2b3563478a230aca0b51352c32ea909c2b472',
          'vendor/magento/module-integration/Test/Unit/Oauth/OauthTest.php',
          '.\n' +
          ' */\n' +
          '\n' +
          'namespace Magento\\Integration\\Test\\Unit\\Oauth;\n' +
          '\n' +
          '/**\n' +
          ' * @SuppressWarnings(PHPMD',
          'https://github.com/Arsalanulhaq/Magento-2.3.4/blob/11b930877d46a35b5de69387e078cbd77416bccc/vendor/magento/module-integration/Test/Unit/Oauth/OauthTest.php',
      ));
    });
  });
});

function randomString(): string {
  return Math.random().toString(36).substring(7);
}
