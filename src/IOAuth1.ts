import OAuth1TemporaryCredentialResponse from './OAuth1TemporaryCredentialResponse';
import IOAuth1TokenCredentialsResponse from './IOAuth1TokenCredentialsResponse';
import IOAuth1TemporaryCredentialRequest from './IOAuth1TemporaryCredentialRequest';
import IOAuth1TokenCredentialsRequest from './IOAuth1TokenCredentialsRequest';

/**
 * OAuth version 1 interface.
 *
 * @see https://tools.ietf.org/html/rfc5849
 */
export default interface IOAuth1 {
  /**
   * 2.1.  Temporary Credentials
   *
   * The client obtains a set of temporary credentials from the server by
   * making an authenticated (Section 3) HTTP "POST" request to the
   * Temporary Credential Request endpoint (unless the server advertises
   * another HTTP request method for the client to use).  The client
   * constructs a request URI by adding the following REQUIRED parameter
   * to the request (in addition to the other protocol parameters, using
   * the same parameter transmission method):
   *
   * oauth_callback:  An absolute URI back to which the server will
   * redirect the resource owner when the Resource Owner
   * Authorization step (Section 2.2) is completed.  If
   * the client is unable to receive callbacks or a
   * callback URI has been established via other means,
   * the parameter value MUST be set to "oob" (case
   * sensitive), to indicate an out-of-band
   * configuration.
   *
   * Servers MAY specify additional parameters.
   *
   * When making the request, the client authenticates using only the
   * client credentials.  The client MAY omit the empty "oauth_token"
   * protocol parameter from the request and MUST use the empty string as
   * the token secret value.
   *
   * Since the request results in the transmission of plain text
   * credentials in the HTTP response, the server MUST require the use of
   * a transport-layer mechanisms such as TLS or Secure Socket Layer (SSL)
   * (or a secure channel with equivalent protections).
   *
   * For example, the client makes the following HTTPS request:
   *
   * POST /request_temp_credentials HTTP/1.1
   * Host: server.example.com
   * Authorization: OAuth realm="Example",
   * oauth_consumer_key="jd83jd92dhsh93js",
   * oauth_signature_method="PLAINTEXT",
   * oauth_callback="http%3A%2F%2Fclient.example.net%2Fcb%3Fx%3D1",
   * oauth_signature="ja893SD9%26"
   *
   * The server MUST verify (Section 3.2) the request and if valid,
   * respond back to the client with a set of temporary credentials (in
   * the form of an identifier and shared-secret).  The temporary
   * credentials are included in the HTTP response body using the
   * "application/x-www-form-urlencoded" content type as defined by
   * [W3C.REC-html40-19980424] with a 200 status code (OK).
   *
   * ...
   *
   * @see https://tools.ietf.org/html/rfc5849#section-2.1
   *
   * 3.1.  Making Requests
   *
   * An authenticated request includes several protocol parameters.  Each
   * parameter name begins with the "oauth_" prefix, and the parameter
   * names and values are case sensitive.  Clients make authenticated
   * requests by calculating the values of a set of protocol parameters
   * and adding them to the HTTP request as follows:
   *
   * 1.  The client assigns value to each of these REQUIRED (unless
   * specified otherwise) protocol parameters:
   *
   * oauth_consumer_key
   * The identifier portion of the client credentials (equivalent to
   * a username).  The parameter name reflects a deprecated term
   * (Consumer Key) used in previous revisions of the specification,
   * and has been retained to maintain backward compatibility.
   *
   * oauth_token
   * The token value used to associate the request with the resource
   * owner.  If the request is not associated with a resource owner
   * (no token available), clients MAY omit the parameter.
   *
   * oauth_signature_method
   * The name of the signature method used by the client to sign the
   * request, as defined in Section 3.4.
   *
   * oauth_timestamp
   * The timestamp value as defined in Section 3.3.  The parameter
   * MAY be omitted when using the "PLAINTEXT" signature method.
   *
   * oauth_nonce
   * The nonce value as defined in Section 3.3.  The parameter MAY
   * be omitted when using the "PLAINTEXT" signature method.
   *
   * oauth_version
   * OPTIONAL.  If present, MUST be set to "1.0".  Provides the
   * version of the authentication process as defined in this
   * specification.
   *
   * 2.  The protocol parameters are added to the request using one of the
   * transmission methods listed in Section 3.5.  Each parameter MUST
   * NOT appear more than once per request.
   *
   * 3.  The client calculates and assigns the value of the
   * "oauth_signature" parameter as described in Section 3.4 and adds
   * the parameter to the request using the same method as in the
   * previous step.
   *
   * 4.  The client sends the authenticated HTTP request to the server.
   *
   * For example, to make the following HTTP request authenticated (the
   * "c2&a3=2+q" string in the following examples is used to illustrate
   * the impact of a form-encoded entity-body):
   *
   * POST /request?b5=%3D%253D&a3=a&c%40=&a2=r%20b HTTP/1.1
   * Host: example.com
   * Content-Type: application/x-www-form-urlencoded
   *
   * c2&a3=2+q
   *
   * The client assigns values to the following protocol parameters using
   * its client credentials, token credentials, the current timestamp, a
   * uniquely generated nonce, and indicates that it will use the
   * "HMAC-SHA1" signature method:
   *
   * oauth_consumer_key:     9djdj82h48djs9d2
   * oauth_token:            kkk9d7dh3k39sjv7
   * oauth_signature_method: HMAC-SHA1
   * oauth_timestamp:        137131201
   * oauth_nonce:            7d8f3e4a
   *
   * The client adds the protocol parameters to the request using the
   * OAuth HTTP "Authorization" header field:
   *
   * Authorization: OAuth realm="Example",
   * oauth_consumer_key="9djdj82h48djs9d2",
   * oauth_token="kkk9d7dh3k39sjv7",
   * oauth_signature_method="HMAC-SHA1",
   * oauth_timestamp="137131201",
   * oauth_nonce="7d8f3e4a"
   *
   * Then, it calculates the value of the "oauth_signature" parameter
   * (using client secret "j49sk3j29djd" and token secret "dh893hdasih9"),
   * adds it to the request, and sends the HTTP request to the server:
   *
   * POST /request?b5=%3D%253D&a3=a&c%40=&a2=r%20b HTTP/1.1
   * Host: example.com
   * Content-Type: application/x-www-form-urlencoded
   * Authorization: OAuth realm="Example",
   * oauth_consumer_key="9djdj82h48djs9d2",
   * oauth_token="kkk9d7dh3k39sjv7",
   * oauth_signature_method="HMAC-SHA1",
   * oauth_timestamp="137131201",
   * oauth_nonce="7d8f3e4a",
   * oauth_signature="bYT5CMsGcbgUdFHObYMEfcx6bsw%3D"
   *
   * c2&a3=2+q
   *
   * @see https://tools.ietf.org/html/rfc5849#section-3.1
   *
   * NOTE: Wasn't sure if oauthToken parameter should be left.
   * Since the spec says only that it may be ommited, decided to leave it.
   */
  temporaryCredentialRequest(oAuth1TemporaryCredentialRequest: IOAuth1TemporaryCredentialRequest): Promise<OAuth1TemporaryCredentialResponse>;

  /**
   * 2.2.  Resource Owner Authorization
   *
   * Before the client requests a set of token credentials from the
   * server, it MUST send the user to the server to authorize the request.
   * The client constructs a request URI by adding the following REQUIRED
   * query parameter to the Resource Owner Authorization endpoint URI:
   *
   * oauth_token
   * The temporary credentials identifier obtained in Section 2.1 in
   * the "oauth_token" parameter.  Servers MAY declare this
   * parameter as OPTIONAL, in which case they MUST provide a way
   * for the resource owner to indicate the identifier through other
   * means.
   *
   * Servers MAY specify additional parameters.
   *
   * The client directs the resource owner to the constructed URI using an
   * HTTP redirection response, or by other means available to it via the
   * resource owner's user-agent.  The request MUST use the HTTP "GET"
   * method.
   *
   * For example, the client redirects the resource owner's user-agent to
   * make the following HTTPS request:
   *
   * GET /authorize_access?oauth_token=hdk48Djdsa HTTP/1.1
   * Host: server.example.com
   *
   * ...
   *
   * @see https://tools.ietf.org/html/rfc5849#section-2.2
   */
  resourceOwnerAuthorizationURI(
      oauthToken: string | null,
  ): URL;

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
   * oauth_verifier
   * The verification code received from the server in the previous
   * step.
   *
   * When making the request, the client authenticates using the client
   * credentials as well as the temporary credentials.  The temporary
   * credentials are used as a substitute for token credentials in the
   * authenticated request and transmitted using the "oauth_token"
   * parameter.
   *
   * Since the request results in the transmission of plain text
   * credentials in the HTTP response, the server MUST require the use of
   * a transport-layer mechanism such as TLS or SSL (or a secure channel
   * with equivalent protections).
   *
   * For example, the client makes the following HTTPS request:
   *
   * POST /request_token HTTP/1.1
   * Host: server.example.com
   * Authorization: OAuth realm="Example",
   * oauth_consumer_key="jd83jd92dhsh93js",
   * oauth_token="hdk48Djdsa",
   * oauth_signature_method="PLAINTEXT",
   * oauth_verifier="473f82d3",
   * oauth_signature="ja893SD9%26xyz4992k83j47x0b"
   *
   * The server MUST verify (Section 3.2) the validity of the request,
   * ensure that the resource owner has authorized the provisioning of
   * token credentials to the client, and ensure that the temporary
   * credentials have not expired or been used before.  The server MUST
   * also verify the verification code received from the client.  If the
   * request is valid and authorized, the token credentials are included
   * in the HTTP response body using the
   * "application/x-www-form-urlencoded" content type as defined by
   * [W3C.REC-html40-19980424] with a 200 status code (OK).
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
   */
  tokenCredentialsRequest(oAuth1TokenCredentialsRequest: IOAuth1TokenCredentialsRequest): Promise<IOAuth1TokenCredentialsResponse>;
}

export function implementsIOAuth1(object: any): object is IOAuth1 {
  return object &&
      typeof object.temporaryCredentialRequest === 'function' &&
      typeof object.resourceOwnerAuthorizationURI === 'function' &&
      typeof object.tokenCredentialsRequest === 'function';
}
