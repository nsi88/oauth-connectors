import Connector from './Connector';
import IOAuth2AuthorizationRequest from './IOAuth2AuthorizationRequest';
import * as assert from 'assert';
import IOAuth2AccessTokenRequest from './IOAuth2AccessTokenRequest';
import IOAuth2AccessTokenResponse from './IOAuth2AccessTokenResponse';
import { exchangeWebFlowCode } from '@octokit/oauth-methods';
import { request } from '@octokit/request';
import IOAuth2 from './IOAuth2';
import parseScope from './Github/parseScope';
import AuthCredentials from './AuthCredentials';
import SearchResult from './SearchResult';
import ISearch from './ISearch';
import { Octokit } from '@octokit/rest';
import ConnectorError from './ConnectorError';

export default class Github extends Connector implements IOAuth2, ISearch {
  static DEFAULT_ORIGIN: string | null = 'https://github.com';
  private static AUTHORIZATION_REQUEST_PATH = '/login/oauth/authorize';
  private readonly clientSecret?: string;

  constructor(origin: string | null = Github.DEFAULT_ORIGIN, clientSecret?: string) {
    super(origin);
    this.clientSecret = clientSecret;
  }

  authorizationRequest(oAuth2AuthorizationRequest: IOAuth2AuthorizationRequest): URL {
    assert(oAuth2AuthorizationRequest.responseType === 'code', 'responseType value MUST be set to "code"');
    // TODO: Guarantee that origin won't have / at the end
    let url = `${this.origin}${Github.AUTHORIZATION_REQUEST_PATH}?response_type=` +
        encodeURIComponent(oAuth2AuthorizationRequest.responseType) +
        '&client_id=' + encodeURIComponent(oAuth2AuthorizationRequest.clientId);
    if (oAuth2AuthorizationRequest.redirectUri !== null) {
      url += '&redirect_uri=' + encodeURIComponent(oAuth2AuthorizationRequest.redirectUri);
    }
    if (oAuth2AuthorizationRequest.scope !== null) {
      // NOTE: The value of the scope parameter is expressed as a list of space-
      //    delimited, case-sensitive strings.
      url += '&scope=' + encodeURIComponent(oAuth2AuthorizationRequest.scope.join(' '));
    }
    if (oAuth2AuthorizationRequest.state !== null) {
      url += '&state=' + encodeURIComponent(oAuth2AuthorizationRequest.state);
    }
    return new URL(url);
  }

  async accessTokenRequest(oAuth2AccessTokenRequest: IOAuth2AccessTokenRequest): Promise<IOAuth2AccessTokenResponse> {
    assert(oAuth2AccessTokenRequest.grantType === 'authorization_code', 'grantType value MUST be set to "authorization_code"');
    assert(this.clientSecret !== undefined, 'clientSecret should be setup');
    const { data } = await exchangeWebFlowCode({
      clientType: 'oauth-app',
      clientId: oAuth2AccessTokenRequest.clientId,
      clientSecret: this.clientSecret as string,
      code: oAuth2AccessTokenRequest.code,
      redirectUrl: oAuth2AccessTokenRequest.redirectUri,
      request: request.defaults({
        baseUrl: this.origin,
      }),
    });
    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      // Taking scope from data instead of authentication.
      // Even though in the current octokit implementation they both take scope from response,
      // data feels more like a response and authentication like a request,
      // since authentication contains clientId and secret.
      // Response scope can be different from request scope.
      // See https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps#requested-scopes-and-granted-scopes
      scope: parseScope(data.scope),
      // The next ones are not returned by github
      expiresIn: null,
      refreshToken: null,
    };
  }

  /**
   * Github search
   *
   * See https://docs.github.com/en/rest/reference/search
   */
  async search<T extends AuthCredentials>(
      query: string,
      oAuth2AccessTokenResponse: T | null,
      additionalParameters?: { [key: string]: any },
  ): Promise<Array<SearchResult>> {
    console.info('Github search', query);
    const octokit = this.getOctokit(oAuth2AccessTokenResponse);
    // TODO: Search in issues, commits, etc.
    // Probably should be a parameter telling where to search instead of searching everywhere
    // To search everywhere the connector misses the information how to merge results.
    const { data } = await octokit.search.code({...(additionalParameters || {}), ...{q: query}});
    console.debug('data', data);
    return [];
  }

  /**
   * See https://octokit.github.io/rest.js/v18
   */
  private getOctokit<T extends AuthCredentials>(oAuth2AccessTokenResponse: T | null): Octokit {
    if (oAuth2AccessTokenResponse === null) {
      throw new ConnectorError(this, 'oAuth2AccessTokenResponse is required');
    }
    assert('accessToken' in oAuth2AccessTokenResponse, 'accessToken is required');
    // See examples https://docs.github.com/en/enterprise-server@3.0/rest/guides/getting-started-with-the-rest-api#using-oauth-tokens-for-apps
    const auth = 'token ' + (oAuth2AccessTokenResponse as unknown as IOAuth2AccessTokenResponse).accessToken;
    return new Octokit({
      auth,
      userAgent: 'OAuthConnectors',
      // TODO Fix baseUrl. Different if you use enterprise.
      // "Use http(s)://[hostname]/api/v3 to access the API for GitHub Enterprise Server."
      // https://docs.github.com/en/enterprise-server@3.0/rest/guides/getting-started-with-the-rest-api
      baseUrl: 'https://api.github.com',
    });
  }
}
