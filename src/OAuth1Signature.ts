/**
 * 3.4.  Signature
 *
 * OAuth-authenticated requests can have two sets of credentials: those
 * passed via the "oauth_consumer_key" parameter and those in the
 * "oauth_token" parameter.  In order for the server to verify the
 * authenticity of the request and prevent unauthorized access, the
 * client needs to prove that it is the rightful owner of the
 * credentials.  This is accomplished using the shared-secret (or RSA
 * key) part of each set of credentials.
 *
 * OAuth provides three methods for the client to prove its rightful
 * ownership of the credentials: "HMAC-SHA1", "RSA-SHA1", and
 * "PLAINTEXT".  These methods are generally referred to as signature
 * methods, even though "PLAINTEXT" does not involve a signature.  In
 * addition, "RSA-SHA1" utilizes an RSA key instead of the shared-
 * secrets associated with the client credentials.
 *
 * OAuth does not mandate a particular signature method, as each
 * implementation can have its own unique requirements.  Servers are
 * free to implement and document their own custom methods.
 * Recommending any particular method is beyond the scope of this
 * specification.  Implementers should review the Security
 * Considerations section (Section 4) before deciding on which method to
 * support.
 *
 * The client declares which signature method is used via the
 * "oauth_signature_method" parameter.  It then generates a signature
 * (or a string of an equivalent value) and includes it in the
 * "oauth_signature" parameter.  The server verifies the signature as
 * specified for each method.
 *
 * The signature process does not change the request or its parameters,
 * with the exception of the "oauth_signature" parameter.
 */
enum OAuth1Signature {
  HMAC_SHA1,
  RSA_SHA1,
  PLAINTEXT,
}

export default OAuth1Signature;
