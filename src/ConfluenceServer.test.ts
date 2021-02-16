import ConfluenceServer from './ConfluenceServer';
import OAuth1Signature from './OAuth1Signature';
import OAuth1TemporaryCredentialResponse from './OAuth1TemporaryCredentialResponse';
import IOAuth1TokenCredentialsResponse from './IOAuth1TokenCredentialsResponse';
import SearchResult from './SearchResult';
import ErrorCodeConnectorError from './ErrorCodeConnectorError';
import ErrorCode from './ErrorCode';
import HttpStatusCodeConnectorError from './HttpStatusCodeConnectorError';
import IUserResponse from './Confluence/IUserResponse';
import IJsonRpcContent from './Confluence/IJsonRpcContent';
import NetworkError from './NetworkError';
import { dataCallback, oauth1tokenCallback } from 'oauth';

const mockGetOAuthRequestToken = jest.fn();
const mockGetOAuthAccessToken = jest.fn();
const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock('./Confluence/OAuthConsumer', () => {
  return {
    default: jest.fn().mockImplementation(() => {
      return {
        getOAuthRequestToken: mockGetOAuthRequestToken,
        getOAuthAccessToken: mockGetOAuthAccessToken,
        get: mockGet,
        post: mockPost,
      };
    }),
  };
});

let confluenceServer: ConfluenceServer;
const oauthConsumerKey = 'Loocle';
const oauthToken = 'validToken';
const oauthSignatureMethod = OAuth1Signature.RSA_SHA1;
const oauthTimestamp: number | null = null;
const oauthNonce: string | null = null;
const oauthVersion: string | null = null;

beforeEach(() => {
  jest.clearAllMocks();
  confluenceServer = new ConfluenceServer('http://confluence.yourdomain.com');
});

describe('temporaryCredentialRequest', () => {
  test('when confluence returns consumer_key_unknown error', async () => {
    mockGetOAuthRequestToken.mockImplementation((callback: oauth1tokenCallback) => {
      callback({statusCode: 401, data: 'oauth_problem=consumer_key_unknown'}, '', '', {});
    });
    await expect(confluenceServer.temporaryCredentialRequest({
      oauthCallback: new URL('http://localhost:8000/'),
      oauthConsumerKey,
      oauthToken,
      oauthSignatureMethod,
      oauthTimestamp,
      oauthNonce,
      oauthVersion,
    }))
    .rejects.toThrow(new ErrorCodeConnectorError(ErrorCode.ORIGIN_LINK_REQUIRED, confluenceServer, 'oauth_problem=consumer_key_unknown'));
  });

  test('when confluence returns "ECONNREFUSED" error', async () => {
    const error = new NetworkError(undefined, '127.0.0.1', 'ECONNREFUSED', 'ECONNREFUSED', 8003, 'connect');
    mockGetOAuthRequestToken.mockImplementation(() => { throw error; });
    await expect(confluenceServer.temporaryCredentialRequest({
      oauthCallback: new URL('http://localhost:8000/'),
      oauthConsumerKey,
      oauthToken,
      oauthSignatureMethod,
      oauthTimestamp,
      oauthNonce,
      oauthVersion,
    }))
    .rejects.toThrow(new ErrorCodeConnectorError(ErrorCode.ORIGIN_UNAVAILABLE, confluenceServer, JSON.stringify(error)));
  });

  test('when confluence returns 404 error', async () => {
    mockGetOAuthRequestToken.mockImplementation((callback: oauth1tokenCallback) => {
      callback({statusCode: 404, data: '<html>Not found</html>'}, '', '', {});
    });
    await expect(confluenceServer.temporaryCredentialRequest({
      oauthCallback: new URL('http://localhost:8000/'),
      oauthConsumerKey,
      oauthToken,
      oauthSignatureMethod,
      oauthTimestamp,
      oauthNonce,
      oauthVersion,
    }))
    .rejects.toThrow(new HttpStatusCodeConnectorError(404, confluenceServer, JSON.stringify({
      statusCode: 404,
      data: '<html>Not found</html>',
    })));
  });

  test('when confluence returns a valid OAuth1TemporaryCredentialResponse', async () => {
    const token = 'g7dNtrOeju3VoyABerwlMgYeUoDxB0qr';
    const tokenSecret = 'X2xuDPk2tc9BFpkCwrvANcogIJmO8664';
    mockGetOAuthRequestToken.mockImplementation((callback: oauth1tokenCallback) => {
      callback(null, token, tokenSecret, {'oauth_callback_confirmed': 'true'});
    });
    await expect(confluenceServer.temporaryCredentialRequest({
      oauthCallback: new URL('http://localhost:8000/'),
      oauthConsumerKey,
      oauthToken,
      oauthSignatureMethod,
      oauthTimestamp,
      oauthNonce,
      oauthVersion,
    })).resolves.toStrictEqual(new OAuth1TemporaryCredentialResponse(token, tokenSecret, true));
  });
});

describe('resourceOwnerAuthorizationURI', () => {
  test('with valid params', () => {
    expect(confluenceServer.resourceOwnerAuthorizationURI('token'))
    .toStrictEqual(new URL('http://confluence.yourdomain.com/plugins/servlet/oauth/authorize?oauth_token=token'));
  });
});

describe('tokenCredentialsRequest', () => {
  const oauthVerifier = 'abcde';

  test('when confluence returns an error', async () => {
    const error = new NetworkError(undefined, 'address', 'ENOTFOUND', 'ENOTFOUND', 8000, 'getaddrinfo');
    mockGetOAuthAccessToken.mockImplementation(() => { throw error; });
    await expect(confluenceServer.tokenCredentialsRequest({
      oauthVerifier,
      oauthConsumerKey,
      oauthToken,
      oauthSignatureMethod,
      oauthTimestamp,
      oauthNonce,
      oauthVersion,
    })).rejects.toThrow(new HttpStatusCodeConnectorError(
        500,
        confluenceServer,
        JSON.stringify(error),
    ));
  });

  test('when confluence returns a valid IOAuth1TokenCredentialsResponse', async () => {
    mockGetOAuthAccessToken.mockImplementation((_oauthToken: string, _secret: string, _oauthVerifier: string, callback: oauth1tokenCallback) => {
      callback(null, 'token', 'tokenSecret', null);
    });
    await expect(confluenceServer.tokenCredentialsRequest({
      oauthVerifier,
      oauthConsumerKey,
      oauthToken,
      oauthSignatureMethod,
      oauthTimestamp,
      oauthNonce,
      oauthVersion,
    })).resolves.toStrictEqual({ oauthToken: 'token', oauthTokenSecret: 'tokenSecret' });
  });
});

describe('search', () => {
  const oAuth1TokenCredentialsResponse: IOAuth1TokenCredentialsResponse = { oauthToken: 'oauthToken', oauthTokenSecret: 'oauthTokenSecret' };

  test('without oAuth1TokenCredentialsResponse', async () => {
    await expect(confluenceServer.search('(title~"test" or text~"test")', null))
    .rejects.toThrow('IOAuth1TokenCredentialsResponse is required');
  });

  test('when confluence returns an error', async () => {
    const error = {statusCode: 301, data: '<html>Moved permanently</html>'};
    mockGet.mockImplementation((url: string, oauthToken: string, oauthTokenSecret: string, contentType: string, callback: dataCallback) => {
      expect(url).toStrictEqual('http://confluence.yourdomain.com/rest/api/content/search?cql=(title~"test" or text~"test")&expand=body.view.value,version.by.userKey&limit=20');
      expect(oauthToken).toStrictEqual('oauthToken');
      expect(oauthTokenSecret).toStrictEqual('oauthTokenSecret');
      expect(contentType).toStrictEqual('application/json');
      callback(error);
    });
    await expect(confluenceServer.search('(title~"test" or text~"test")', oAuth1TokenCredentialsResponse))
    .rejects.toThrow(new HttpStatusCodeConnectorError(
        301,
        confluenceServer,
        JSON.stringify(error),
    ));
  });

  test('when confluence returns a valid result', async () => {
    mockGet.mockImplementation((...args: any) => {
      const callback = args[args.length - 1] as dataCallback;
      callback(null, JSON.stringify(confluenceServerValidResult));
    });
    await expect(confluenceServer.search('(title~"test" or text~"test")', oAuth1TokenCredentialsResponse))
    .resolves.toStrictEqual([new SearchResult('65591', 'Test', '', 'http://localhost:8090/display/TEST/Test', '402880824ff933a4014ff9345d7c0002', 1588595958.283)]);
  });
});

const versionBy: IUserResponse = {
  'type': 'known',
  'username': 'jsmith',
  'userKey': '402880824ff933a4014ff9345d7c0002',
  'profilePicture': {
    'path': '/wiki/relative/avatar.png',
    'width': 48,
    'height': 48,
    'isDefault': true,
  },
  'displayName': 'Joe Smith',
  '_links': {
    'base': 'http://myhost:8080/confluence',
    'context': '/confluence',
    'self': 'http://myhost:8080/confluence/rest/experimental/user?key=402880824ff933a4014ff9345d7c0002',
  },
  '_expandable': {
    'status': '',
  },
};
const confluenceServerValidResult: object = {
  results: [{
    id: '65591', type: 'page', status: 'current',
    title: 'Test', restrictions: {}, _links: {
      webui: '/display/TEST/Test', tinyui: '/x/NwAB',
      self: 'http://localhost:8090/rest/api/content/65591',
    }, _expandable: {
      container: '',
      metadata: '', extensions: '', operations: '', children: '',
      history: '/rest/api/content/65591/history', ancestors: '', body: '', version: '',
      descendants: '', space: '/rest/api/space/TEST',
    },
    version: {
      by: versionBy,
      hidden: false,
      message: 'draw.io diagram',
      minorEdit: false,
      number: 6,
      when: '2020-05-04T12:39:18.283Z',
    },
  }],
  start: 0, limit: 25, size: 1,
  cqlQuery: 'text~\'*test*\'', searchDuration: 19, totalSize: 1,
  _links: {
    self: 'http://localhost:8090/rest/api/content/search?cql=text~%22*test*%22',
    base: 'http://localhost:8090', context: '',
  },
};

describe('visited', () => {
  const oAuth1TokenCredentialsResponse: IOAuth1TokenCredentialsResponse = { oauthToken: 'oauthToken', oauthTokenSecret: 'oauthTokenSecret' };

  test('when confluence returns a valid result', async () => {
    mockGet.mockImplementation((url: string, oauthToken: string, oauthTokenSecret: string, contentType: string, callback: dataCallback) => {
      expect(url).toStrictEqual('http://confluence.yourdomain.com/rest/api/content/search?cql=id%20in%20recentlyViewedContent(50)&expand=metadata.currentuser.viewed&limit=50');
      expect(oauthToken).toStrictEqual('oauthToken');
      expect(oauthTokenSecret).toStrictEqual('oauthTokenSecret');
      expect(contentType).toStrictEqual('application/json');
      callback(null, JSON.stringify(confluenceServerValidResult));
    });
    await expect(confluenceServer.visited(oAuth1TokenCredentialsResponse, 50))
    .resolves.toStrictEqual(['65591']);
  });
});

describe('currentUser', () => {
  const oAuth1TokenCredentialsResponse: IOAuth1TokenCredentialsResponse = { oauthToken: 'oauthToken', oauthTokenSecret: 'oauthTokenSecret' };
  const currentUserResponse: IUserResponse = {
    'type': 'known',
    'username': 'jsmith',
    'userKey': '402880824ff933a4014ff9345d7c0002',
    'profilePicture': {
      'path': '/wiki/relative/avatar.png',
      'width': 48,
      'height': 48,
      'isDefault': true,
    },
    'displayName': 'Joe Smith',
    '_links': {
      'base': 'http://myhost:8080/confluence',
      'context': '/confluence',
      'self': 'http://myhost:8080/confluence/rest/experimental/user?key=402880824ff933a4014ff9345d7c0002',
    },
    '_expandable': {
      'status': '',
    },
  };

  test('when confluence returns a valid result', async () => {
    mockGet.mockImplementation((url: string, oauthToken: string, oauthTokenSecret: string, contentType: string, callback: dataCallback) => {
      expect(url).toStrictEqual('http://confluence.yourdomain.com/rest/api/user/current');
      expect(oauthToken).toStrictEqual('oauthToken');
      expect(oauthTokenSecret).toStrictEqual('oauthTokenSecret');
      expect(contentType).toStrictEqual('application/json');
      callback(null, JSON.stringify(currentUserResponse));
    });
    await expect(confluenceServer.currentUser(oAuth1TokenCredentialsResponse))
    .resolves.toStrictEqual({
      id: currentUserResponse.userKey,
      name: currentUserResponse.displayName,
    });
  });
});

describe('favorites', () => {
  const oAuth1TokenCredentialsResponse: IOAuth1TokenCredentialsResponse = { oauthToken: 'oauthToken', oauthTokenSecret: 'oauthTokenSecret' };

  test('when confluence returns a valid result', async () => {
    mockPost.mockImplementation((url: string, oauthToken: string, oauthTokenSecret: string, body: string, contentType: string, callback: dataCallback) => {
      expect(url).toStrictEqual('http://confluence.yourdomain.com/rpc/json-rpc/confluenceservice-v2/getLabelContentByName');
      expect(oauthToken).toStrictEqual('oauthToken');
      expect(oauthTokenSecret).toStrictEqual('oauthTokenSecret');
      expect(body).toStrictEqual('["my:favourite"]');
      expect(contentType).toStrictEqual('application/json');
      callback(null, JSON.stringify(favoritesResponse));
    });
    await expect(confluenceServer.favorites(oAuth1TokenCredentialsResponse, 50))
    .resolves.toStrictEqual(['300387164', '76659770', '318608189', '392136826']);
  });
});

const favoritesResponse: IJsonRpcContent[] = [{
  'type': 'page',
  'id': 300387164,
  'title': 'Flights Filter Usage',
  'url': 'https://confluence.skyscannertools.net/display/VES/Flights+Filter+Usage',
  'excerpt': 'TL;DR The top 6 most used filters in flight searches are: Return flights (82% of searches) Airline 2+ stops switch 1 stop switch Outbound departure time Inbound departure time Duration One-way flights (18% of searches) 2+ stops switch 1 stop switch Airlin',
}, {
  'type': 'page',
  'id': 76659770,
  'title': 'Plugin Developers',
  'url': 'https://confluence.skyscannertools.net/display/CONDUCTOR/Plugin+Developers',
  'excerpt': 'Why make a plugin for the conductor? Why should you make a plugin? When should you not make a plugin? Creating a Plugin An explanation of what is required for a plugin as well as a step-by-step tutorial for writing one in java Running the Plugin and Condu',
}, {
  'type': 'page',
  'id': 318608189,
  'title': 'Hotels Filter Usage',
  'url': 'https://confluence.skyscannertools.net/display/VES/Hotels+Filter+Usage',
  'excerpt': 'Intro As with flights, we want to add sort and filter pills to the Hokkaido hotels widget in combined results. In order not to overpopulate the screen with filter pills, we want to understand which filters are most used so we can give the pills the best p',
}, {
  'type': 'page',
  'id': 392136826,
  'title': '💊 Combined Results filter / bucket pills',
  'url': 'https://confluence.skyscannertools.net/pages/viewpage.action?pageId=392136826',
  'excerpt': 'Kick off Design elliepujol Project Lead danielmoreno Engineering armenabrahamyan reneargento sergeynovikov Product danishmistry mortensorth Data science stefanofranco Marketing JIRA Epic Experiment Ticket Comms channel #aviato-public for support Stakehold',
}];
