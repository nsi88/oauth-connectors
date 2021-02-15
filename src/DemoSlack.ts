import Slack from './Slack';
import IOAuth2AuthorizationRequest from './IOAuth2AuthorizationRequest';
import assert = require('assert');
import IOAuth2AccessTokenRequest from './IOAuth2AccessTokenRequest';
import IOAuth2AccessTokenResponse from './IOAuth2AccessTokenResponse';
import AuthCredentials from './AuthCredentials';
import IUser from './IUser';
import IDemoAuth from './IDemoAuth';

/**
 * Slack connector for a demo account.
 *
 * Allows to try searching in Slack without any actions from user.
 */
export default class DemoSlack extends Slack implements IDemoAuth {
  static DEFAULT_ORIGIN: string | null = 'https://loocle.slack.com';
  private static readonly CURRENT_USER_ID = 'demo';
  private static readonly CURRENT_USER_NAME = 'demo';
  private readonly accessToken: string | undefined;

  constructor(origin: string | null = Slack.DEFAULT_ORIGIN, clientSecret?: string, accessToken?: string) {
    super(origin, clientSecret);
    this.accessToken = accessToken;
  }

  authorizationRequest(oAuth2AuthorizationRequest: IOAuth2AuthorizationRequest): URL {
    assert(oAuth2AuthorizationRequest.redirectUri !== null, 'redirectUri is required');
    assert((oAuth2AuthorizationRequest.redirectUri as string).includes('?'), 'redirectUri without ? is not supported');
    return new URL(oAuth2AuthorizationRequest.redirectUri + '&state=' + oAuth2AuthorizationRequest.state + '&code=demo');
  }

  async accessTokenRequest(_oAuth2AccessTokenRequest: IOAuth2AccessTokenRequest): Promise<IOAuth2AccessTokenResponse> {
    assert(this.accessToken !== undefined, 'accessToken is required');
    return {
      accessToken: this.accessToken as string,
      tokenType: 'tokenType',
      expiresIn: null,
      refreshToken: null,
      scope: null,
    };
  }

  async currentUser<T extends AuthCredentials>(_oAuth2AccessTokenResponse: T | null): Promise<IUser> {
    return {
      id: DemoSlack.CURRENT_USER_ID,
      name: DemoSlack.CURRENT_USER_NAME,
    };
  }

  async favorites<T extends AuthCredentials>(_oAuth2AccessTokenResponse: T | null, _limit?: number): Promise<Array<string>> {
    return [];
  }

  async demoAuth(): Promise<IOAuth2AccessTokenResponse> {
    return this.accessTokenRequest(null as unknown as IOAuth2AccessTokenRequest);
  }
}
