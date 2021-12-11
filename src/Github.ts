import Connector from './Connector';
import IOAuth2AuthorizationRequest from './IOAuth2AuthorizationRequest';
import * as assert from 'assert';
import IOAuth2AccessTokenRequest from './IOAuth2AccessTokenRequest';
import IOAuth2AccessTokenResponse from './IOAuth2AccessTokenResponse';
import { exchangeWebFlowCode } from '@octokit/oauth-methods';
import { request } from '@octokit/request';
import IOAuth2 from './IOAuth2';

export default class Github extends Connector implements IOAuth2 {
  static DEFAULT_ORIGIN: string | null = 'https://github.com';
  private static AUTHORIZATION_REQUEST_PATH = '/login/oauth/authorize';
  // See https://github.com/octokit/oauth-methods.js/#getwebflowauthorizationurl
  private static REST_API_ROOT_ENDPOINT = '/api/v3';
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
    const { authentication, data } = await exchangeWebFlowCode({
      clientType: 'oauth-app',
      clientId: oAuth2AccessTokenRequest.clientId,
      clientSecret: this.clientSecret as string,
      code: oAuth2AccessTokenRequest.code,
      redirectUrl: oAuth2AccessTokenRequest.redirectUri,
      request: request.defaults({
        baseUrl: this.origin + Github.REST_API_ROOT_ENDPOINT,
      }),
    });
    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      // TODO: Ensure that authentication.scopes and data.scope are the same
      scope: authentication.scopes,
      // The next ones are not returned by github
      expiresIn: null,
      refreshToken: null,
    };
  }
}
