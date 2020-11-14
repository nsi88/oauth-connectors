import * as assert from 'assert';

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
 * ...
 *
 * The response contains the following REQUIRED parameters:
 *
 * oauth_token
 * The temporary credentials identifier.
 *
 * oauth_token_secret
 * The temporary credentials shared-secret.
 *
 * oauth_callback_confirmed
 * MUST be present and set to "true".  The parameter is used to
 * differentiate from previous versions of the protocol.
 *
 * Note that even though the parameter names include the term 'token',
 * these credentials are not token credentials, but are used in the next
 * two steps in a similar manner to token credentials.
 *
 * For example (line breaks are for display purposes only):
 * HTTP/1.1 200 OK
 * Content-Type: application/x-www-form-urlencoded
 *
 * oauth_token=hdk48Djdsa&oauth_token_secret=xyz4992k83j47x0b&
 * oauth_callback_confirmed=true
 *
 * @see https://tools.ietf.org/html/rfc5849#section-2.1
 */
export default class OAuth1TemporaryCredentialResponse {
  oauthToken: string;
  oauthTokenSecret: string;
  oauthCallbackConfirmed: boolean;

  constructor(oauthToken: string, oauthTokenSecret: string, oauthCallbackConfirmed: boolean) {
    this.oauthToken = oauthToken;
    this.oauthTokenSecret = oauthTokenSecret;
    // NOTE: Left intentionally === true instead of just (assert(oauthCallbackConfirmed,
    // to fail with any other value.
    assert(oauthCallbackConfirmed === true, 'oauthCallbackConfirmed MUST be present and set to "true"');
    this.oauthCallbackConfirmed = oauthCallbackConfirmed;
  }
}
