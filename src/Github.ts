import Connector from './Connector';
import IOAuth2AuthorizationRequest from './IOAuth2AuthorizationRequest';
import * as assert from 'assert';

export default class Github extends Connector {
  static DEFAULT_ORIGIN: string | null = 'https://github.com';
  private static AUTHORIZATION_REQUEST_PATH = '/login/oauth/authorize';

  constructor(origin: string | null = Github.DEFAULT_ORIGIN) {
    super(origin);
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
}
