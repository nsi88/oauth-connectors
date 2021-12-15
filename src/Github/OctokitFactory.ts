import IOAuth2AccessTokenResponse from '../IOAuth2AccessTokenResponse';
import { Octokit } from '@octokit/rest';

export default class OctokitFactory {
  static build(origin: string, oAuth2AccessTokenResponse: IOAuth2AccessTokenResponse): Octokit {
    // See examples https://docs.github.com/en/enterprise-server@3.0/rest/guides/getting-started-with-the-rest-api#using-oauth-tokens-for-apps
    const auth = 'token ' + oAuth2AccessTokenResponse.accessToken;
    return new Octokit({
      auth,
      userAgent: 'OAuthConnectors',
      baseUrl: this.baseUrl(origin),
      // Uncomment to debug requests
      // log: console,
    });
  }

  /**
   * "Use http(s)://[hostname]/api/v3 to access the API for GitHub Enterprise Server."
   * https://docs.github.com/en/enterprise-server@3.0/rest/guides/getting-started-with-the-rest-api
   */
  private static baseUrl(origin: string): string {
    const url = new URL(origin);
    if (url.hostname === 'github.com') {
      return 'https://api.github.com';
    }
    return `${url.protocol}//${url.hostname}/api/v3`;
  }
}
