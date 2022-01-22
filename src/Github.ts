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
import OctokitFactory from './Github/OctokitFactory';
import { components } from '@octokit/openapi-types';
import HttpStatusCodeConnectorError from './HttpStatusCodeConnectorError';
import { RequestError } from '@octokit/request-error';
import ErrorCodeConnectorError from './ErrorCodeConnectorError';
import ErrorCode from './ErrorCode';

type Fetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

// TODO Implement ICurrentUser, IFavorites, IVisited
export default class Github extends Connector implements IOAuth2, ISearch {
  static DEFAULT_ORIGIN: string | null = 'https://github.com';
  private static AUTHORIZATION_REQUEST_PATH = '/login/oauth/authorize';
  private readonly clientSecret?: string;
  private readonly fetch?: Fetch;

  // Injecting fetch function was the easiest way to test octokit.
  // This approach https://codeutility.org/jest-mocking-of-octokit-library/ didn't work
  // because we need to mock only request and leave other methods as is.
  // Using spyOn, something like jest.spyOn(Octokit.prototype, 'request') saying, there is no prototype.
  // Haven't found quickly what to spy on.
  // octokit/core uses the injection approach in here
  // https://github.com/octokit/core.js/blob/b753efbf2514991f89503ac2d1fa1f73a7ae284e/test/request.test.ts
  constructor(origin: string | null = Github.DEFAULT_ORIGIN, clientSecret?: string, fetch?: Fetch) {
    super(origin);
    this.clientSecret = clientSecret;
    this.fetch = fetch;
  }

  private static buildSearchResult(codeSearchResultItem: components['schemas']['code-search-result-item']): SearchResult {
    let text: string | null = null;
    if (codeSearchResultItem.text_matches?.[0]?.fragment) {
      // TODO: Return the whole file content if a parameter passed
      text = codeSearchResultItem.text_matches[0].fragment;
    }
    return new SearchResult(
      // The options to build id were: sha, url, git_url, html_url
      // sha is not unique. From the urls git_url was the shortest.
      codeSearchResultItem.git_url,
      codeSearchResultItem.path,
      text,
      // Opens the file content on github
      codeSearchResultItem.html_url,
      // No information about users in search result items.
      // Maybe need to make a separate request to get it.
      undefined,
      // TODO: Make an additional request to get the info if a parameter passed
      undefined,
    );
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
      _additionalParameters?: { [key: string]: any },
  ): Promise<Array<SearchResult>> {
    console.info('Github search', query);
    const octokit = this.getOctokit(oAuth2AccessTokenResponse);
    // TODO: Search in issues, commits, etc.
    // Probably should be a parameter telling where to search instead of searching everywhere
    // To search everywhere the connector misses the information how to merge results.

    // Using octokit.request (custom request) instead of octokit.search.code to return text_matches
    const { data } = await octokit.request('GET /search/code', {
      q: query,
      headers: {
        // To return text matches
        // See https://docs.github.com/en/rest/reference/search#text-match-metadata
        accept: 'application/vnd.github.v3.text-match+json',
      },
      request: {
        fetch: this.fetch,
      },
    });
    console.debug('data', data);
    return data.items.map(Github.buildSearchResult.bind(this));
  }

  /**
   * See https://octokit.github.io/rest.js/v18
   */
  private getOctokit<T extends AuthCredentials>(oAuth2AccessTokenResponse: T | null): Octokit {
    if (oAuth2AccessTokenResponse === null) {
      // TODO: Don't throw ConnectorError. Only its children. Make ConnectorError abstract
      throw new ConnectorError(this, 'oAuth2AccessTokenResponse is required');
    }
    assert('accessToken' in oAuth2AccessTokenResponse, 'accessToken is required');

    const octokit = OctokitFactory.build(this.origin, oAuth2AccessTokenResponse as unknown as IOAuth2AccessTokenResponse);

    octokit.hook.error('request', (error: RequestError | Error) => {
      if (error instanceof RequestError) {
        throw new HttpStatusCodeConnectorError((error as RequestError).status, this, error.message);
      }
      throw new ErrorCodeConnectorError(ErrorCode.UNKNOWN, this, error.message);
    });
    return octokit;
  }
}
