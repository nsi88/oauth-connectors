import SearchResult from './SearchResult';
import OAuth1TemporaryCredentialResponse from './OAuth1TemporaryCredentialResponse';
import IOAuth1TokenCredentialsResponse from './IOAuth1TokenCredentialsResponse';
import * as assert from 'assert';
import IOAuth1 from './IOAuth1';
import ISearch from './ISearch';
import AuthCredentials from './AuthCredentials';
import Connector from './Connector';
import ISearchResult from './Confluence/ISearchResult';
import ErrorCode from './ErrorCode';
import ConnectorError from './ConnectorError';
import ErrorCodeConnectorError from './ErrorCodeConnectorError';
import HttpStatusCodeConnectorError from './HttpStatusCodeConnectorError';
import IVisited from './IVisited';
import IUser from './IUser';
import ICurrentUser from './ICurrentUser';
import IJsonRpcContent from './Confluence/IJsonRpcContent';
import IFavorites from './IFavorites';
import OAuthConsumer from './Confluence/OAuthConsumer';
import NetworkError from './NetworkError';
import { dataCallback } from 'oauth';
import { ClientRequest } from 'http';
import IOAuth1TemporaryCredentialRequest from './IOAuth1TemporaryCredentialRequest';
import IOAuth1TokenCredentialsRequest from './IOAuth1TokenCredentialsRequest';

export type OAuth1tokenCallbackError = { statusCode: number, data?: any };
type Json = { [name: string]: any };

export default class ConfluenceServer extends Connector implements IOAuth1, ISearch, IVisited, ICurrentUser, IFavorites {
  static LIST_APPLICATIION_LINKS_PATH = '/plugins/servlet/applinks/listApplicationLinks';
  private static REQUEST_TOKEN_PATH = '/plugins/servlet/oauth/request-token';
  private static ACCESS_TOKEN_PATH = '/plugins/servlet/oauth/access-token';
  private static CONTENT_SEARCH_PATH = '/rest/api/content/search';
  private static USER_GET_CURRENT_PATH = '/rest/api/user/current';
  private static GET_LABEL_CONTENT_BY_NAME = '/rpc/json-rpc/confluenceservice-v2/getLabelContentByName';
  private static AUTHORIZE_PATH = '/plugins/servlet/oauth/authorize';

  // Taken from https://docs.atlassian.com/ConfluenceServer/rest/7.11.0/#api/search-search
  private static supportedSearchQueryParameters: Set<string> = new Set([
    'cql', 'cqlcontext', 'excerpt', 'expand', 'start', 'limit', 'includeArchivedSpaces',
  ]);

  private static link(response: { [key: string]: any }, searchResult: ISearchResult): string {
    return response['_links']['base'] + searchResult._links.webui;
  }

  private static searchQueryString(parameters: { [key: string]: any }): string {
    return Object.keys(parameters).map(parameterName => {
      if (!this.supportedSearchQueryParameters.has(parameterName)) {
        // TODO: Decide if we need to throw a ErrorCodeConnectorError instead
        throw new TypeError(`Unexpected parameterName ${parameterName}`);
      }
      return encodeURIComponent(parameterName) + '=' + encodeURIComponent(parameters[parameterName]);
    }).join('&');
  }

  async temporaryCredentialRequest(oAuth1TemporaryCredentialRequest: IOAuth1TemporaryCredentialRequest): Promise<OAuth1TemporaryCredentialResponse> {
    const oAuthConsumer =
        new OAuthConsumer(this.getRequestUrl(),
            this.getAccessUrl(),
            oAuth1TemporaryCredentialRequest.oauthCallback.toString());
    return new Promise((resolve, reject) => {
      try {
        oAuthConsumer.getOAuthRequestToken((error: OAuth1tokenCallbackError | null, token: string, tokenSecret: string, parsedQueryString: any) => {
          if (error) {
            console.warn('Error during getting confluence request token', error);
            return reject(this.oAuth1tokenCallbackErrorToErrorCodeConnectorError(error));
          }
          resolve(new OAuth1TemporaryCredentialResponse(
              token, tokenSecret, parsedQueryString['oauth_callback_confirmed'] === 'true',
          ));
        });
      } catch (e) {
        reject(this.errorToErrorCodeConnectorError(e));
      }
    });
  }

  resourceOwnerAuthorizationURI(
      oauthToken: string | null,
  ): URL {
    return new URL(
        this.origin + ConfluenceServer.AUTHORIZE_PATH + '?oauth_token=' + oauthToken,
    );
  }

  async tokenCredentialsRequest(oAuth1TokenCredentialsRequest: IOAuth1TokenCredentialsRequest): Promise<IOAuth1TokenCredentialsResponse> {
    // TODO: Support all the client parameters (signature method, ...)
    assert(oAuth1TokenCredentialsRequest.oauthToken !== null, 'oauthToken should not be null');
    const oAuthConsumer =
        new OAuthConsumer(this.getRequestUrl(),
            this.getAccessUrl(),
            null);
    return new Promise((resolve, reject) => {
      try {
        oAuthConsumer.getOAuthAccessToken(
            oAuth1TokenCredentialsRequest.oauthToken as string,
            '',
            oAuth1TokenCredentialsRequest.oauthVerifier,
            (error: OAuth1tokenCallbackError | null, token: string, tokenSecret: string) => {
              if (error) {
                console.warn('Error during getting confluence access token', error);
                return reject(this.oAuth1tokenCallbackErrorToErrorCodeConnectorError(error));
              }
              resolve({ oauthToken: token, oauthTokenSecret: tokenSecret });
            });
      } catch (e) {
        reject(this.errorToErrorCodeConnectorError(e));
      }
    });
  }

  /**
   * ConfluenceServer response example: {"results":[...],
   * "start":0,"limit":25,"size":1,
   * "cqlQuery":"text~\"*test*\"","searchDuration":19,"totalSize":1,
   * "_links":{"self":"http://localhost:8090/rest/api/content/search?cql=text~%22*test*%22",
   * "base":"http://localhost:8090","context":""}}
   *
   * result example:
   * {id: "53924763", type: "page", status: "current", title: "Optimise for Time: Productivity by Focusing on What's Important", container: {…}, …}
   * body: view: {value: "<h2 id="OptimiseforTime:ProductivitybyFocusingonWh… useful doing other things?</li></ul><p><br/></p>", representation: "storage", _expandable: {…}}
   * _expandable: {editor: "", export_view: "", styled_view: "", storage: "", anonymous_export_view: ""}
   * __proto__: Object
   * container: {id: 54460423, key: "~andywalker", name: "Andy Walker", type: "personal", _links: {…}, …}
   * extensions: {position: "none"}
   * id: "53924763"
   * status: "current"
   * title: "Optimise for Time: Productivity by Focusing on What's Important"
   * type: "page"
   * _expandable: {metadata: "", operations: "", children: "/rest/api/content/53924763/child", restrictions: "/rest/api/content/53924763/restriction/byOperation", history: "/rest/api/content/53924763/history", …}
   * _links: {webui: "/display/~andywalker/Optimise+for+Time%3A+Productivity+by+Focusing+on+What%27s+Important", edit: "/pages/resumedraft.action?draftId=53924763&draftShareId=8cb71055-3fb8-462d-92ed-aefd0c372904", tinyui: "/x/m9M2Aw", self: "https://confluence.skyscannertools.net/rest/api/content/53924763"}
   * __proto__: Object
   *
   * body.view is optional field and is present as long as expand=body is used in the search query
   *
   * @param query - CQL
   * @param oAuth1TokenCredentialsResponse
   * @param additionalParameters are all described in here https://docs.atlassian.com/ConfluenceServer/rest/7.11.0/#api/search-search
   * apart of cql which is already passed as query.
   */
  // TODO: Figure out why this page can't be found by title
  //  https://confluence.skyscannertools.net/display/CORE/Atlantis+data+dump+files
  // TODO: Improve search results for "decomission instances using slingshot"
  async search<T extends AuthCredentials>(
      query: string,
      oAuth1TokenCredentialsResponse: T | null,
      additionalParameters?: { [key: string]: any },
  ): Promise<Array<SearchResult>> {
    console.info('Search with confluence', query, additionalParameters);
    // TODO: Validate cql
    const parameters = {
      ...(additionalParameters || {}),
      ...{cql: query, expand: 'body.view.value,version.by.userKey'},
    };
    const url = this.origin + ConfluenceServer.CONTENT_SEARCH_PATH + '?' + ConfluenceServer.searchQueryString(parameters);
    const json = await this.oAuthConsumerRequest(oAuth1TokenCredentialsResponse, 'GET', url);
    assert('results' in json, `Invalid json ${JSON.stringify(json)}`);
    return (json['results'] as Array<ISearchResult>).map(this.responseResultToSearchResult.bind(this, json));
  }

  async visited<T extends AuthCredentials>(oAuth1TokenCredentialsResponse: T | null, limit?: number): Promise<Array<string>> {
    console.info('ConfluenceServer visited', limit);
    // TODO: Add sorting by "metadata.currentuser.viewed.lastSeen"
    limit = limit || 100;
    const url = this.origin + ConfluenceServer.CONTENT_SEARCH_PATH +
        `?cql=id%20in%20recentlyViewedContent(${limit})&expand=metadata.currentuser.viewed&limit=${limit}`;
    const json = await this.oAuthConsumerRequest(oAuth1TokenCredentialsResponse, 'GET', url);
    assert('results' in json, `Invalid json ${JSON.stringify(json)}`);
    return (json['results'] as Array<ISearchResult>).map(searchResult => searchResult.id);
  }

  /**
   * Get current user.
   * Response example
   * {
   * "statusCode":200,
   * "headers":{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Credentials":true},
   * "body":
   * "{\"type\":\"known\",\"username\":\"sergeynovikov\",\"userKey\":\"8ab3a51e68c9fbde0168dab9f4c20003\",
   * \"profilePicture\":{\"path\":\"/download/attachments/104403089/user-avatar\",\"width\":48,\"height\":48,
   * \"isDefault\":false},\"displayName\":\"Sergey Novikov\",\"_links\":{\"base\":\"https://confluence.skyscannertools.net\",
   * \"context\":\"\",\"self\":\"https://confluence.skyscannertools.net/rest/api/user?key=8ab3a51e68c9fbde0168dab9f4c20003\"},
   * \"_expandable\":{\"status\":\"\"}}"
   * }
   */
  async currentUser<T extends AuthCredentials>(oAuth1TokenCredentialsResponse: T | null): Promise<IUser> {
    console.info('ConfluenceServer currentUser');
    const url = this.origin + ConfluenceServer.USER_GET_CURRENT_PATH;
    const json = await this.oAuthConsumerRequest(oAuth1TokenCredentialsResponse, 'GET', url);
    console.debug('ConfluenceServer currentUser', json);
    assert('userKey' in json);
    return {id: json['userKey'], name: json['displayName']};
  }

  async favorites<T extends AuthCredentials>(oAuth1TokenCredentialsResponse: T | null, limit?: number): Promise<Array<string>> {
    console.info('ConfluenceServer favorites', limit);
    const url = this.origin + ConfluenceServer.GET_LABEL_CONTENT_BY_NAME;
    const body = '["my:favourite"]';
    const json = await this.oAuthConsumerRequest(oAuth1TokenCredentialsResponse, 'POST', url, body);
    console.debug('ConfluenceServer favorites', json);
    assert(Array.isArray(json), `Invalid json ${JSON.stringify(json)}`);
    return (json as Array<IJsonRpcContent>).map(jsonRpcContent => jsonRpcContent.id.toString());
  }

  private oAuthConsumerRequest<T extends AuthCredentials>(oAuth1TokenCredentialsResponse: T | null, method: string, url: string, body?: string): Promise<Json> {
    this.validateOAuth1TokenCredentialsResponse(oAuth1TokenCredentialsResponse);
    const oauthToken = (oAuth1TokenCredentialsResponse as unknown as IOAuth1TokenCredentialsResponse).oauthToken;
    const oauthTokenSecret = (oAuth1TokenCredentialsResponse as unknown as IOAuth1TokenCredentialsResponse).oauthTokenSecret;
    const oAuthConsumer = new OAuthConsumer(
        this.getRequestUrl(),
        this.getAccessUrl(),
        // NOTE node-oauth package we use, requires the parameter.
        // The value is taken from specs.
        // "If the client is unable to receive callbacks or a
        // callback URI has been established via other means,
        // the parameter value MUST be set to "oob" (case
        // sensitive), to indicate an out-of-band
        // configuration."
        // See https://tools.ietf.org/html/rfc5849#section-2.1
        'oob',
    );
    const contentType = 'application/json';
    let oAuthConsumerMethod: (callback: dataCallback) => ClientRequest;
    if (method === 'GET') {
      oAuthConsumerMethod = oAuthConsumer.get.bind(oAuthConsumer, url, oauthToken, oauthTokenSecret, contentType);
    } else if (method === 'POST') {
      // @ts-ignore
      oAuthConsumerMethod = oAuthConsumer.post.bind(oAuthConsumer, url, oauthToken, oauthTokenSecret, body, contentType);
    } else {
      throw new Error('Invalid or unsupported method ' + method);
    }
    return new Promise((resolve, reject) => {
      try {
        oAuthConsumerMethod((error, result, response) => {
          if (error) {
            console.warn('ConfluenceServer get error', error);
            return reject(this.oAuth1tokenCallbackErrorToErrorCodeConnectorError(error));
          }
          if (response && response.statusCode && response.statusCode >= 400) {
            throw new HttpStatusCodeConnectorError(response.statusCode as number, this, response.statusCode.toString());
          }
          assert(typeof result === 'string', 'result expected to be of string type');
          resolve(JSON.parse(result as string));
        });
      } catch (e) {
        reject(this.errorToErrorCodeConnectorError(e));
      }
    });
  }

  private validateOAuth1TokenCredentialsResponse<T extends AuthCredentials>(oAuth1TokenCredentialsResponse: T | null): void {
    if (oAuth1TokenCredentialsResponse === null) {
      throw new ConnectorError(this, 'IOAuth1TokenCredentialsResponse is required');
    }
    assert('oauthToken' in oAuth1TokenCredentialsResponse, 'oauthToken is required');
    assert('oauthTokenSecret' in oAuth1TokenCredentialsResponse, 'oauthTokenSecret is required');
  }

  private responseResultToSearchResult(response: { [key: string]: any }, searchResult: ISearchResult): SearchResult {
    let text = '';
    if (searchResult.body !== undefined) {
      text = searchResult.body.view.value;
    }
    let userId: string | undefined = undefined;
    let updatedAt: number | undefined = undefined;
    if (searchResult.version) {
      userId = searchResult.version.by.userKey;
      try {
        updatedAt = new Date(searchResult.version.when).getTime() / 1000;
      } catch (e) {
        console.error('Error when parsing version when', searchResult.version.when, e);
      }
    }
    return new SearchResult(searchResult.id, searchResult.title, text, ConfluenceServer.link(response, searchResult), userId, updatedAt);
  }

  private oAuth1tokenCallbackErrorToErrorCodeConnectorError(error: OAuth1tokenCallbackError): ErrorCodeConnectorError {
    if (error.data === 'oauth_problem=consumer_key_unknown') {
      throw new ErrorCodeConnectorError(ErrorCode.ORIGIN_LINK_REQUIRED, this, error.data);
    }
    throw new ErrorCodeConnectorError(ErrorCode.UNKNOWN, this, JSON.stringify(error));
  }

  private errorToErrorCodeConnectorError<T extends Error>(error: T): ErrorCodeConnectorError {
    const code = 'code' in error ? (error as unknown as NetworkError).code : undefined;
    if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
      throw new ErrorCodeConnectorError(ErrorCode.ORIGIN_UNAVAILABLE, this, JSON.stringify(error));
    }
    throw new ErrorCodeConnectorError(ErrorCode.UNKNOWN, this, error.message);
  }

  private getRequestUrl(): string {
    return this.origin + ConfluenceServer.REQUEST_TOKEN_PATH;
  }

  private getAccessUrl(): string {
    return this.origin + ConfluenceServer.ACCESS_TOKEN_PATH;
  }
}
