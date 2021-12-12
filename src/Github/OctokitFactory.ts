import IOAuth2AccessTokenResponse from '../IOAuth2AccessTokenResponse';
import { Octokit } from '@octokit/rest';

export default class OctokitFactory {
  static build(_origin: string, oAuth2AccessTokenResponse: IOAuth2AccessTokenResponse): Octokit {
    // See examples https://docs.github.com/en/enterprise-server@3.0/rest/guides/getting-started-with-the-rest-api#using-oauth-tokens-for-apps
    const auth = 'token ' + oAuth2AccessTokenResponse.accessToken;
    return new Octokit({
      auth,
      userAgent: 'OAuthConnectors',
      // TODO Fix baseUrl. Different if you use enterprise.
      // "Use http(s)://[hostname]/api/v3 to access the API for GitHub Enterprise Server."
      // https://docs.github.com/en/enterprise-server@3.0/rest/guides/getting-started-with-the-rest-api
      baseUrl: 'https://api.github.com',
    });
  }
}
