export default interface IOAuth2AuthorizationRequest {
  responseType: string;
  clientId: string;
  redirectUri: string | null;
  scope: string[] | null;
  state: string | null;
}
