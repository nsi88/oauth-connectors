import IOAuth2AccessTokenResponse from './IOAuth2AccessTokenResponse';
import IOAuth2AuthorizationRequest from './IOAuth2AuthorizationRequest';
import IOAuth2AccessTokenRequest from './IOAuth2AccessTokenRequest';

/**
 * OAuth version 2 interface.
 *
 * @see https://tools.ietf.org/html/rfc6749
 */
export default interface IOAuth2 {
  /**
   * 4.1.1.  Authorization Request
   *
   * The client constructs the request URI by adding the following
   * parameters to the query component of the authorization endpoint URI
   * using the "application/x-www-form-urlencoded" format, per Appendix B:
   *
   * response_type
   * REQUIRED.  Value MUST be set to "code".
   *
   * client_id
   * REQUIRED.  The client identifier as described in Section 2.2.
   *
   * redirect_uri
   * OPTIONAL.  As described in Section 3.1.2.
   *
   * scope
   * OPTIONAL.  The scope of the access request as described by
   * Section 3.3.
   *
   * state
   * RECOMMENDED.  An opaque value used by the client to maintain
   * state between the request and callback.  The authorization
   * server includes this value when redirecting the user-agent back
   * to the client.  The parameter SHOULD be used for preventing
   * cross-site request forgery as described in Section 10.12.
   *
   * ...
   *
   * @see https://tools.ietf.org/html/rfc6749#section-4.1.1
   *
   * 3.3.  Access Token Scope
   *
   * The authorization and token endpoints allow the client to specify the
   * scope of the access request using the "scope" request parameter.  In
   * turn, the authorization server uses the "scope" response parameter to
   * inform the client of the scope of the access token issued.
   *
   * The value of the scope parameter is expressed as a list of space-
   * delimited, case-sensitive strings.  The strings are defined by the
   * authorization server.  If the value contains multiple space-delimited
   * strings, their order does not matter, and each string adds an
   * additional access range to the requested scope.
   *
   * scope       = scope-token *( SP scope-token )
   * scope-token = 1*( %x21 / %x23-5B / %x5D-7E )
   *
   * ...
   *
   * @see https://tools.ietf.org/html/rfc6749#section-3.3
   */
  authorizationRequest(oAuth2AuthorizationRequest: IOAuth2AuthorizationRequest): URL;

  /**
   * 4.1.3.  Access Token Request
   *
   * The client makes a request to the token endpoint by sending the
   * following parameters using the "application/x-www-form-urlencoded"
   * format per Appendix B with a character encoding of UTF-8 in the HTTP
   * request entity-body:
   *
   * grant_type
   * REQUIRED. Value MUST be set to "authorization_code".
   *
   * code
   * REQUIRED. The authorization code received from the
   * authorization server.
   *
   * redirect_uri
   * REQUIRED, if the "redirect_uri" parameter was included in the
   * authorization request as described in Section 4.1.1, and their
   * values MUST be identical.
   *
   * client_id
   * REQUIRED, if the client is not authenticating with the
   * authorization server as described in Section 3.2.1.
   *
   * @see https://tools.ietf.org/html/rfc6749#section-4.1.3
   *
   * 4.1.4.  Access Token Response
   *
   * If the access token request is valid and authorized, the
   * authorization server issues an access token and optional refresh
   * token as described in Section 5.1.  If the request client
   * authentication failed or is invalid, the authorization server returns
   * an error response as described in Section 5.2.
   *
   * @see https://tools.ietf.org/html/rfc6749#section-4.1.4
   */
  accessTokenRequest(oAuth2AccessTokenRequest: IOAuth2AccessTokenRequest): Promise<IOAuth2AccessTokenResponse>;
}

export function implementsIOAuth2(object: any): object is IOAuth2 {
  return object &&
      typeof object.authorizationRequest === 'function' &&
      typeof object.accessTokenRequest === 'function';
}
