import { WebAPICallResult, WebClient } from '@slack/web-api';
import SearchResult from './SearchResult';
import IOAuth2 from './IOAuth2';
import IOAuth2AccessTokenResponse from './IOAuth2AccessTokenResponse';
import * as assert from 'assert';
import ISearch from './ISearch';
import AuthCredentials from './AuthCredentials';
import Connector from './Connector';
import IMessages from './Slack/IMessages';
import IMessageMatch from './Slack/IMessageMatch';
import IFileMatch from './Slack/IFileMatch';
import IFiles from './Slack/IFiles';
import ErrorCodeConnectorError from './ErrorCodeConnectorError';
import ErrorCode from './ErrorCode';
import IUser from './IUser';
import ICurrentUser from './ICurrentUser';
import IAuthTestResponse from './Slack/IAuthTestResponse';
import IReactionsListResponse from './Slack/IReactionsListResponse';
import IFavorites from './IFavorites';
import IOAuth2AuthorizationRequest from './IOAuth2AuthorizationRequest';
import IOAuth2AccessTokenRequest from './IOAuth2AccessTokenRequest';
import ConnectorError from "./ConnectorError";

export default class Slack extends Connector implements IOAuth2, ISearch, ICurrentUser, IFavorites {
  static DEFAULT_ORIGIN: string | null = 'https://slack.com';
  private readonly webClient: WebClient;
  private readonly clientSecret?: string;

  constructor(origin: string | null = Slack.DEFAULT_ORIGIN, timeout?: number, clientSecret?: string) {
    super(origin, timeout);
    this.webClient = new WebClient(undefined, {
      retryConfig: {
        maxRetryTime: 6000,
        retries: 0,
      },
    });
    this.clientSecret = clientSecret;
  }

  private static messageMatchToSearchResult(match: IMessageMatch): SearchResult {
    return new SearchResult(match.ts, Slack.extractMessageTitle(match), Slack.processText(match.text), match.permalink, match.user, parseFloat(match.ts));
  }

  private static fileMatchToSearchResult(match: IFileMatch): SearchResult {
    // TODO: Think about more consistent titles including username.
    //  username's for file matches are empty and the Slack app currently doesn't have permissions
    //  to requesting it by user id which is present
    // TODO: Support non-plaintext previews (e.g. images, or png's)
    return new SearchResult(match.id, match.title, match.preview || null, match.permalink, match.user, match.timestamp);
  }

  /**
   * Extracts title from the given IMessageMatch
   *
   * Example:
   * extractTitle({
   * channel: {id: "C08SK623U", is_channel: true, is_group: false, is_im: false, name: "security-support", …}
   * ...
   * ts: "1567419432.078200"
   * ...
   * username: "sergey.novikov"
   * })
   * returns
   * @sergey.novikov #security-support Sep 2nd, 2019
   *
   * The title format is made like this to be similar to title in Slack search results.
   */
  private static extractMessageTitle(match: IMessageMatch): string {
    const ts = parseFloat(match.ts);
    // TODO: Move date formatting to a single place (to have the same format everywhere)
    // TODO: Write full user name (the same way as in Slack search results), not a username (e.g. @sergey.novikov)
    // TODO: Support is_group channels, e.g.
    // id: "GQ6BK10TF"
    // is_channel: false
    // is_ext_shared: false
    // is_group: true
    // is_im: false
    // is_mpim: true
    // is_org_shared: false
    // is_private: true
    // is_shared: false
    // name: "mpdm-samk--sergey.novikov--misha.tiurin-1"
    //
    let title = '@' + match.username;
    if (match.channel.is_channel) {
      title += ' #' + match.channel.name;
    }
    title += ' - ' + new Date(ts * 1000).toDateString();
    return title;
  }

  /**
   * Process Slack specific text
   */
  private static processText(text: string): string {
    // TODO: Implement the processing properly (links, links with alternative text, smiles, what else?)
    return text.replace(/</g, '').replace(/>/g, '');
  }

  authorizationRequest(oAuth2AuthorizationRequest: IOAuth2AuthorizationRequest): URL {
    assert(oAuth2AuthorizationRequest.responseType === 'code', 'responseType value MUST be set to "code"');
    let url = 'https://slack.com/oauth/authorize?response_type=' + encodeURIComponent(oAuth2AuthorizationRequest.responseType) +
        '&client_id=' + encodeURIComponent(oAuth2AuthorizationRequest.clientId);
    if (oAuth2AuthorizationRequest.redirectUri !== null) {
      url += '&redirect_uri=' + encodeURIComponent(oAuth2AuthorizationRequest.redirectUri);
    }
    if (oAuth2AuthorizationRequest.scope !== null) {
      // NOTE: The value of the scope parameter is expressed as a list of space-
      //    delimited, case-sensitive strings.
      url += '&scope=' + encodeURIComponent(oAuth2AuthorizationRequest.scope.join(' '));
    }
    if (oAuth2AuthorizationRequest.state !== null) {
      url += '&state=' + encodeURIComponent(oAuth2AuthorizationRequest.state);
    }
    return new URL(url);
  }

  async accessTokenRequest(oAuth2AccessTokenRequest: IOAuth2AccessTokenRequest): Promise<IOAuth2AccessTokenResponse> {
    assert(oAuth2AccessTokenRequest.grantType === 'authorization_code', 'grantType value MUST be set to "authorization_code"');
    assert(this.clientSecret !== undefined, 'clientSecret should be setup');
    let webAPICallResult: WebAPICallResult;
    try {
      webAPICallResult = await this.webClient.oauth.access({
        client_id: oAuth2AccessTokenRequest.clientId,
        client_secret: this.clientSecret as string,
        code: oAuth2AccessTokenRequest.code,
        redirect_uri: oAuth2AccessTokenRequest.redirectUri,
      });
    } catch (e) {
      this.handleError(e);
    }
    if (webAPICallResult.error !== undefined) {
      this.handleError(new Error(webAPICallResult.error));
    }
    // TODO: Pass all response properties
    assert(webAPICallResult.access_token);
    return {
      accessToken: webAPICallResult.access_token as string,
      tokenType: 'tokenType',
      expiresIn: null,
      refreshToken: null,
      scope: null,
    };
  }

  /**
   * Slack search
   * @param query
   * @param oAuth2AccessTokenResponse
   * @param additionalParameters are the same that WebClient.search.all accepts.
   * @see https://api.slack.com/methods/search.all/test
   */
  async search<T extends AuthCredentials>(
      query: string,
      oAuth2AccessTokenResponse: T | null,
      additionalParameters: { [key: string]: any } | null = null,
  ): Promise<Array<SearchResult>> {
    console.info('Slack search', query);
    if (oAuth2AccessTokenResponse === null) {
      throw new ConnectorError(this, 'oAuth2AccessTokenResponse is required');
    }
    assert('accessToken' in oAuth2AccessTokenResponse, 'accessToken is required');
    const defaultAdditionalParameters = {
      count: 20,
      highlight: false,
      page: 1,
      sort: 'score',
      sort_dir: 'desc',
    };
    additionalParameters = {...defaultAdditionalParameters, ...(additionalParameters || {})};
    let webAPICallResult: WebAPICallResult;
    try {
      webAPICallResult = await (this.webClient.search.all({
        token: (oAuth2AccessTokenResponse as unknown as IOAuth2AccessTokenResponse).accessToken,
        query,
        count: additionalParameters['count'],
        highlight: additionalParameters['highlight'],
        page: additionalParameters['page'],
        sort: additionalParameters['sort'],
        sort_dir: additionalParameters['sort_dir'],
      }));
    } catch (e) {
      this.handleError(e);
    }
    console.debug('Slack search response', webAPICallResult);
    const messageMatches: Array<IMessageMatch> = (webAPICallResult.messages as IMessages).matches as Array<IMessageMatch>;
    const fileMatches: Array<IFileMatch> = (webAPICallResult.files as IFiles).matches as Array<IFileMatch>;
    return messageMatches.map(Slack.messageMatchToSearchResult).concat(fileMatches.map(Slack.fileMatchToSearchResult));
  }

  /**
   * Get current user.
   *
   * See https://api.slack.com/methods/auth.test
   */
  async currentUser<T extends AuthCredentials>(oAuth2AccessTokenResponse: T | null): Promise<IUser> {
    // NOTE: The type allows null because ICurrentUser interface allows null
    if (oAuth2AccessTokenResponse === null) {
      throw new Error('IOAuth2AccessTokenResponse is required');
    }
    let webAPICallResult: WebAPICallResult;
    try {
      webAPICallResult = await this.webClient.auth.test({
        token: (oAuth2AccessTokenResponse as unknown as IOAuth2AccessTokenResponse).accessToken,
      });
    } catch (e) {
      this.handleError(e);
    }
    if (webAPICallResult.error !== undefined) {
      this.handleError(new Error(webAPICallResult.error));
    }
    const authTestResponse = webAPICallResult as unknown as IAuthTestResponse;
    assert(authTestResponse.user_id);
    return {
      id: authTestResponse.user_id as string,
      name: authTestResponse.user,
    };
  }

  async favorites<T extends AuthCredentials>(oAuth2AccessTokenResponse: T | null, limit?: number): Promise<Array<string>> {
    if (oAuth2AccessTokenResponse === null) {
      throw new Error('IOAuth2AccessTokenResponse is required');
    }
    let webAPICallResult: WebAPICallResult;
    limit = limit || 100;
    try {
      webAPICallResult = await this.webClient.reactions.list({
        token: (oAuth2AccessTokenResponse as unknown as IOAuth2AccessTokenResponse).accessToken,
        count: limit,
        limit,
      });
    } catch (e) {
      this.handleError(e);
    }
    if (webAPICallResult.error !== undefined) {
      this.handleError(new Error(webAPICallResult.error));
    }
    const reactions = webAPICallResult as unknown as IReactionsListResponse;
    if (reactions.items === undefined) {
      throw new Error('items shouldnot be null when there is no error field');
    }
    return (reactions.items).map(item => {
      if (item.type === 'message' && item.message) {
        if (item.message.ts) {
          return item.message.ts;
        }
        if (item.message.files && item.message.files[0].id) {
          return item.message.files[0].id;
        }
      }
      console.warn('Invalid or unsupported reaction item', item);
      return undefined;
    }).filter(id => id !== undefined) as string[];
  }

  private handleError(error: Error): never {
    if (error.message.includes('invalid_auth')) {
      throw new ErrorCodeConnectorError(ErrorCode.INVALID_OAUTH_CODE, this, error.message);
    }
    if (error.message.includes('Network Error')) {
      throw new ErrorCodeConnectorError(ErrorCode.NETWORK_ERROR, this, error.message);
    }

    // The codes below are taken from https://api.slack.com/methods/auth.test
    if (error.message.includes('not_authed')) {
      throw new ErrorCodeConnectorError(ErrorCode.MISSING_OAUTH_CODE, this, error.message);
    }
    if (error.message.includes('invalid_auth') || error.message.includes('token_revoked')) {
      throw new ErrorCodeConnectorError(ErrorCode.INVALID_OAUTH_CODE, this, error.message);
    }
    if (error.message.includes('account_inactive')) {
      throw new ErrorCodeConnectorError(ErrorCode.ACCOUNT_INACTIVE, this, error.message);
    }
    if (error.message.includes('no_permission') ||
        error.message.includes('ekm_access_denied') ||
        error.message.includes('missing_scope') ||
        error.message.includes('accesslimited')) {
      throw new ErrorCodeConnectorError(ErrorCode.NO_PERMISSION, this, error.message);
    }
    if (error.message.includes('org_login_required') ||
        error.message.includes('request_timeout') ||
        error.message.includes('service_unavailable')) {
      throw new ErrorCodeConnectorError(ErrorCode.ORIGIN_UNAVAILABLE, this, error.message);
    }

    throw new ErrorCodeConnectorError(ErrorCode.UNKNOWN, this, error.message);
  }
}
