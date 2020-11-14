export default interface IOAuth2AccessTokenRequest {
  grantType: string;
  code: string;
  redirectUri: string;
  clientId: string;
}

export function implementsIOAuth2AccessTokenRequest(object: { [name: string]: any }): object is IOAuth2AccessTokenRequest {
  const maybe = object as IOAuth2AccessTokenRequest;
  // tslint:disable-next-line:strict-type-predicates
  return maybe.grantType !== undefined && maybe.code !== undefined && maybe.redirectUri !== undefined && maybe.clientId !== undefined;
}
