import OAuth1Signature from './OAuth1Signature';

export default interface IOAuth1TokenCredentialsRequest {
  oauthVerifier: string;
  oauthConsumerKey: string;
  oauthToken: string | null;
  oauthSignatureMethod: OAuth1Signature;
  oauthTimestamp: number | null;
  oauthNonce: string | null;
  oauthVersion: string | null;
}

export function implementsIOAuth1TokenCredentialsRequest(object: { [name: string]: any }): object is IOAuth1TokenCredentialsRequest {
  const maybe = object as IOAuth1TokenCredentialsRequest;
  // tslint:disable-next-line:strict-type-predicates
  return maybe.oauthVerifier !== undefined && maybe.oauthConsumerKey !== undefined && maybe.oauthSignatureMethod !== undefined;
}
