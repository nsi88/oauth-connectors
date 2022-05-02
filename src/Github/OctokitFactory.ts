import IOAuth2AccessTokenResponse from '../IOAuth2AccessTokenResponse';
import { Octokit } from '@octokit/rest';
import ITimeout, { implementsITimeout } from '../ITimeout';
import IRetries, { implementsIRetries } from '../IRetries';
import { throttling } from '@octokit/plugin-throttling';

export default class OctokitFactory {
  static build(origin: string, oAuth2AccessTokenResponse: IOAuth2AccessTokenResponse, additionalParameters: { [key: string]: any } = {}): Octokit {
    // See examples https://docs.github.com/en/enterprise-server@3.0/rest/guides/getting-started-with-the-rest-api#using-oauth-tokens-for-apps
    const auth = 'token ' + oAuth2AccessTokenResponse.accessToken;
    const timeoutSec = implementsITimeout(additionalParameters) ? (additionalParameters as ITimeout).timeout / 1000 : undefined;
    const retries = implementsIRetries(additionalParameters) ? (additionalParameters as IRetries).retries : undefined;
    const OctokitWithThrottling = Octokit.plugin(throttling);
    return new OctokitWithThrottling({
      auth,
      userAgent: 'OAuthConnectors',
      baseUrl: this.baseUrl(origin),
      // Uncomment to debug requests
      // log: console,
      throttle: {
        onRateLimit: this.onRateLimit.bind(this, timeoutSec, retries),
        onSecondaryRateLimit: this.onRateLimit.bind(this, timeoutSec, retries),
      },
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

  /**
   * https://octokit.github.io/rest.js/v18#throttling
   */
  private static onRateLimit(timeoutSec: number | undefined, retries: number | undefined, retryAfterSec: number, options: any): boolean {
    console.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
    console.debug(`timeout: ${timeoutSec}, retries: ${retries}, retryAfter: ${retryAfterSec}`);
    if (timeoutSec !== undefined && retryAfterSec > timeoutSec) {
      console.debug(`retryAfter ${retryAfterSec} > timeout ${timeoutSec}. Not retrying`);
      return false;
    }
    if (retries === undefined) {
      console.debug('No retries');
      return false;
    }
    if (options.request.retryCount > retries) {
      console.debug(`Retries limit ${retries} exceeded`);
      return false;
    }
    console.debug(`Retrying after ${retryAfterSec} seconds!`);
    return true;
  }
}
