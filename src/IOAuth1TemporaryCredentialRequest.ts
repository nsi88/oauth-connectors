import OAuth1Signature from './OAuth1Signature';

export default interface IOAuth1TemporaryCredentialRequest {
  oauthCallback: URL;
  oauthConsumerKey: string;
  oauthToken: string | null;
  oauthSignatureMethod: OAuth1Signature;
  oauthTimestamp: number | null;
  oauthNonce: string | null;
  oauthVersion: string | null;
}

export function implementsIOAuth1TemporaryCredentialRequest(object: { [name: string]: any }): object is IOAuth1TemporaryCredentialRequest {
  const maybe = object as IOAuth1TemporaryCredentialRequest;
  // tslint:disable-next-line:strict-type-predicates
  return maybe.oauthCallback !== undefined && maybe.oauthConsumerKey !== undefined && maybe.oauthSignatureMethod !== undefined;
}
