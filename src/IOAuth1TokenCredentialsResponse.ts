import AuthCredentials from './AuthCredentials';

/**
 * 2.3.  Token Credentials
 *
 * The client obtains a set of token credentials from the server by
 * making an authenticated (Section 3) HTTP "POST" request to the Token
 * Request endpoint (unless the server advertises another HTTP request
 * method for the client to use).  The client constructs a request URI
 * by adding the following REQUIRED parameter to the request (in
 * addition to the other protocol parameters, using the same parameter
 * transmission method):
 *
 * ...
 *
 * The response contains the following REQUIRED parameters:
 *
 * oauth_token
 * The token identifier.
 *
 * oauth_token_secret
 * The token shared-secret.
 *
 * For example:
 *
 * HTTP/1.1 200 OK
 * Content-Type: application/x-www-form-urlencoded
 *
 * oauth_token=j49ddk933skd9dks&oauth_token_secret=ll399dj47dskfjdk
 *
 * The server must retain the scope, duration, and other attributes
 * approved by the resource owner, and enforce these restrictions when
 * receiving a client request made with the token credentials issued.
 *
 * Once the client receives and stores the token credentials, it can
 * proceed to access protected resources on behalf of the resource owner
 * by making authenticated requests (Section 3) using the client
 * credentials together with the token credentials received.
 *
 * @see https://tools.ietf.org/html/rfc5849#section-2.3
 */
export default interface IOAuth1TokenCredentialsResponse extends AuthCredentials {
  oauthToken: string;
  oauthTokenSecret: string;
}

export function implementsIOAuth1TokenCredentialsResponse(object: { [name: string]: any }): object is IOAuth1TokenCredentialsResponse {
  const maybe = object as IOAuth1TokenCredentialsResponse;
  // tslint:disable-next-line:strict-type-predicates
  return maybe.oauthToken !== undefined && maybe.oauthTokenSecret !== undefined;
}
