import AuthCredentials from './AuthCredentials';

/**
 * OAuth version 2 access token.
 *
 * 5.1.  Successful Response
 *
 * The authorization server issues an access token and optional refresh
 * token, and constructs the response by adding the following parameters
 * to the entity-body of the HTTP response with a 200 (OK) status code:
 *
 * access_token
 * REQUIRED.  The access token issued by the authorization server.
 *
 * token_type
 * REQUIRED.  The type of the token issued as described in
 * Section 7.1.  Value is case insensitive.
 *
 * expires_in
 * RECOMMENDED.  The lifetime in seconds of the access token.  For
 * example, the value "3600" denotes that the access token will
 * expire in one hour from the time the response was generated.
 * If omitted, the authorization server SHOULD provide the
 * expiration time via other means or document the default value.
 *
 * refresh_token
 * OPTIONAL.  The refresh token, which can be used to obtain new
 * access tokens using the same authorization grant as described
 * in Section 6.
 *
 * scope
 * OPTIONAL, if identical to the scope requested by the client;
 * otherwise, REQUIRED.  The scope of the access token as
 * described by Section 3.3.
 *
 * @see https://tools.ietf.org/html/rfc6749#section-5.1
 */
export default interface IOAuth2AccessTokenResponse extends AuthCredentials {
  accessToken: string;
  tokenType: string;
  expiresIn: number | null;
  refreshToken: string | null;
  scope: string[] | null;
}

export function implementsIOAuth2AccessTokenResponse(object: { [name: string]: any }): object is IOAuth2AccessTokenResponse {
  const maybe = object as IOAuth2AccessTokenResponse;
  // tslint:disable-next-line:strict-type-predicates
  return maybe.accessToken !== undefined && maybe.tokenType !== undefined;
}
