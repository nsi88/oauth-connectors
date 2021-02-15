import Slack from './Slack';
import SearchResult from './SearchResult';
import ErrorCodeConnectorError from './ErrorCodeConnectorError';
import ErrorCode from './ErrorCode';
import IAuthTestResponse from './Slack/IAuthTestResponse';
import IUser from './IUser';

// NOTE: The variable should be named starting from mock.
// See https://jestjs.io/docs/en/es6-class-mocks#calling-jestmockdocsenjest-objectjestmockmodulename-factory-options-with-the-module-factory-parameter
let mockSearchAll: jest.Mock = jest.fn();
let mockAuthTest: jest.Mock = jest.fn();
let mockOAuthAccess: jest.Mock = jest.fn();
jest.mock('@slack/web-api', () => {
  return {
    WebClient: jest.fn().mockImplementation(() => {
      return {
        search: {
          all: mockSearchAll,
        },
        auth: {
          test: mockAuthTest,
        },
        oauth: {
          access: mockOAuthAccess,
        },
      };
    }),
  };
});

let slack: Slack;
const clientId = '999999999999.999999999999';

beforeEach(() => {
  jest.clearAllMocks();
  slack = new Slack(Slack.DEFAULT_ORIGIN, 'client_secret');
});

describe('authorizationRequest', () => {
  test('with invalid responseType', () => {
    expect(() => {
      slack.authorizationRequest({
        responseType: 'not_code',
        clientId,
        redirectUri: null,
        scope: null,
        state: null,
      });
    }).toThrow('responseType value MUST be set to "code"');
  });

  test('with valid params', () => {
    expect(
        slack.authorizationRequest({
          responseType: 'code',
          clientId,
          redirectUri: 'http://localhost:8000',
          scope: ['search:read'],
          state: 'slack.allowed',
        }),
    ).toStrictEqual(new URL(
        `https://slack.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=http%3A%2F%2Flocalhost%3A8000&scope=search%3Aread&state=slack.allowed`,
    ));
  });
});

describe('accessTokenRequest', () => {
  const code = 'abcde';
  const redirectUri = 'http://localhost:8000';

  test('with invalid grantType', async () => {
    await expect(slack.accessTokenRequest({
      grantType: 'not_authorization_code',
      code,
      redirectUri,
      clientId,
    }))
    .rejects.toThrow('grantType value MUST be set to "authorization_code"');
  });

  test('with invalid code', async () => {
    // @slack/web-api error message:
    // ERROR	Error: An API error occurred: invalid_code
    //     at Object.platformErrorFromResult (/var/task/node_modules/@slack/web-api/dist/errors.js:50:33)
    //     at WebClient.apiCall (/var/task/node_modules/@slack/web-api/dist/WebClient.js:465:28)
    //     at processTicksAndRejections (internal/process/task_queues.js:94:5)
    //     at async Runtime.accessToken [as handler] (/var/task/oauth/slack/accessToken.js:38:18) {
    //   code: 'slack_webapi_platform_error',
    //   data: { ok: false, error: 'invalid_code', response_metadata: {} }
    // }

    mockOAuthAccess.mockImplementation(async () => {
      throw new Error('Got error invalid_code');
    });

    await expect(slack.accessTokenRequest({
      grantType: 'authorization_code',
      code: 'wrong_code',
      redirectUri,
      clientId,
    }))
    .rejects.toThrow('Got error invalid_code');
    expect(mockOAuthAccess).toBeCalledWith({
      'client_id': '999999999999.999999999999',
      'client_secret': 'client_secret',
      'code': 'wrong_code',
      'redirect_uri': 'http://localhost:8000',
    });
  });

  test('when slack returns ECONNREFUSED', async () => {
    const errorMessage = 'Something ECONNREFUSED';
    mockOAuthAccess.mockImplementation(async () => {
      throw new Error(errorMessage);
    });
    await expect(slack.accessTokenRequest({
      grantType: 'authorization_code',
      code: 'right_code',
      redirectUri,
      clientId,
    }))
    .rejects.toThrowError(new ErrorCodeConnectorError(ErrorCode.ORIGIN_UNAVAILABLE, slack, errorMessage));
  });

  test('with valid params', async () => {
    const accessToken = 'accessToken';
    const tokenType = 'tokenType';
    mockOAuthAccess.mockReturnValue({
      access_token: accessToken,
      token_type: tokenType,
      ok: true,
    });
    await expect(slack.accessTokenRequest({
      grantType: 'authorization_code',
      code: 'right_code',
      redirectUri,
      clientId,
    }))
    .resolves.toStrictEqual({ accessToken, tokenType, expiresIn: null, refreshToken: null, scope: null });
    expect(mockOAuthAccess).toBeCalledWith({
      'client_id': '999999999999.999999999999',
      'client_secret': 'client_secret',
      'code': 'right_code',
      'redirect_uri': 'http://localhost:8000',
    });
  });
});

describe('search', () => {
  test('without oAuth2AccessTokenResponse', async () => {
    await expect(slack.search('query', null))
    .rejects.toThrow('oAuth2AccessTokenResponse is required');
  });

  test('when WebClient search throws an error', async () => {
    const errorMessage = 'oAuth2AccessTokenResponse is required';
    mockSearchAll.mockImplementation(() => {
      throw new Error(errorMessage);
    });
    await expect(slack.search('query', { accessToken: 'wrong', tokenType: 'tokenType' }))
    .rejects.toThrow(errorMessage);
    expect(mockSearchAll).toBeCalledWith({
      count: 20,
      highlight: false,
      page: 1,
      query: 'query',
      sort: 'score',
      sort_dir: 'desc',
      token: 'wrong',
    });
  });

  test('when webClient search returns results', async () => {
    mockSearchAll.mockImplementation(() => {
      return {
        files: twoFiles,
        messages: twoMessages,
        ok: true,
        posts: zeroPosts,
        query: 'test',
        response_metadata: {},
      };
    });
    const results = await slack.search('test', { accessToken: 'right', tokenType: 'tokenType' });
    expect(results).toStrictEqual([
      new SearchResult(
          '1583606211.001200',
          '@novikovseregka #test1 - Sat Mar 07 2020',
          'What if I will write a long test text,\ncontaining many lines?\nWill the search api return all the text,\nor it will shrink it?\nInteresting.\nText should be long enough already.\nNo one writes to slack more anyway)',
          'https://loocle.slack.com/archives/CT3U17W0G/p1583606211001200',
          'USZ43DGBE',
          1583606211.0012,
      ),
      new SearchResult(
          '1579953670.000400',
          '@novikovseregka #test2 - Sat Jan 25 2020',
          'test2',
          'https://loocle.slack.com/archives/CT3U1AEHE/p1579953670000400',
          'USZ43DGBE',
          1579953670.0004,
      ),
      new SearchResult(
          'F014SS49UUB',
          'prs_20200603.csv',
          'repository_full_name,avg_pr_open_time_mins,average_bump_pr_open_time_mins,total_bump_prs_received\n' +
          'mshell-batch/mshell-batch-py3,54,-1,3\n' +
          'optimise-prime/operational-metrics-weekly-tracker,579,5249,0\n' +
          'logging-services/grappler-enrichment,-1,-1,1\n' +
          'dmx/artifactory-cli-login,126711,-1,0',
          'https://yourdomain.slack.com/permalink/prs_20200603.csv',
          'UE71AL9U4',
          1583606212,
      ),
      new SearchResult(
          'F014SSASDASD',
          'Corriere della Sera 3 Marzo 2017.pdf',
          null,
          'https://yourdomain.slack.com/files/AAAAAAAAA/BBBBBBBBB/corriere_della_sera_3_marzo_2017.pdf',
          'UE71AL9U5',
          1583606213,
      ),
    ]);
    expect(mockSearchAll).toBeCalledWith({
      count: 20,
      highlight: false,
      page: 1,
      query: 'test',
      sort: 'score',
      sort_dir: 'desc',
      token: 'right',
    });
  });
});

describe('currentUser', () => {
  test('when authCredentials is null', async () => {
    await expect(slack.currentUser(null)).rejects.toThrow('IOAuth2AccessTokenResponse is required');
  });

  describe('when authCredenrials is not null', () => {
    const authCredentials = { accessToken: 'accessToken', tokenType: 'tokenType' };

    describe('when slack responds with an error', () => {
      // NOTE: I'm not sure if webClient always throws an error or it can also return a data structure containing error field.
      //  So, I'm checking both situations. Which might be an unneeded work.
      test('when webClient throws an error', async () => {
        const errorMessage = 'Error occured: account_inactive';
        mockAuthTest.mockImplementation(() => {
          throw new Error(errorMessage);
        });
        await expect(slack.currentUser(authCredentials)).rejects.toThrow(
            new ErrorCodeConnectorError(ErrorCode.ACCOUNT_INACTIVE, slack, errorMessage),
        );
      });

      test('when webClient returns IAuthTestResponse with error', async () => {
        const error = 'token_revoked';
        const iAuthTestResponse: IAuthTestResponse = {ok: false, error};
        mockAuthTest.mockReturnValue(iAuthTestResponse);
        await expect(slack.currentUser(authCredentials)).rejects.toThrow(
            new ErrorCodeConnectorError(ErrorCode.INVALID_OAUTH_CODE, slack, error),
        );
      });

      test('when webClient returns an invalid IAuthTestResponse', async () => {
        // TODO
      });

      test('when webClient returns a valid IAuthTestResponse', async () => {
        mockAuthTest.mockReturnValue(authTestResponse);
        const expectedUser: IUser = {
          id: authTestResponse.user_id as string,
          name: authTestResponse.user,
        };
        await expect(slack.currentUser(authCredentials)).resolves.toStrictEqual(expectedUser);
      });
    });
  });
});

const twoFiles: object = {
  total: 0,
  pagination: {total_count: 0, page: 1, per_page: 20, page_count: 0, first: 1, last: 0},
  paging: {count: 20, total: 0, page: 1, pages: 0},
  matches: [{
    id: 'F014SS49UUB',
    title: 'prs_20200603.csv',
    preview: 'repository_full_name,avg_pr_open_time_mins,average_bump_pr_open_time_mins,total_bump_prs_received\n' +
        'mshell-batch/mshell-batch-py3,54,-1,3\n' +
        'optimise-prime/operational-metrics-weekly-tracker,579,5249,0\n' +
        'logging-services/grappler-enrichment,-1,-1,1\n' +
        'dmx/artifactory-cli-login,126711,-1,0',
    permalink: 'https://yourdomain.slack.com/permalink/prs_20200603.csv',
    timestamp: 1583606212,
    user: 'UE71AL9U4',
  }, {
    id: 'F014SSASDASD',
    title: 'Corriere della Sera 3 Marzo 2017.pdf',
    permalink: 'https://yourdomain.slack.com/files/AAAAAAAAA/BBBBBBBBB/corriere_della_sera_3_marzo_2017.pdf',
    timestamp: 1583606213,
    user: 'UE71AL9U5',
  }],
};
const twoMessages: object = {
  total: 2,
  pagination: {total_count: 2, page: 1, per_page: 20, page_count: 1, first: 1, last: 2},
  paging: {count: 20, total: 2, page: 1, pages: 1},
  matches: [{
    iid: 'dd4db6b1-7c96-4df8-bf18-688500b1b14c',
    team: 'TSZHFF2LQ',
    channel: {
      id: 'CT3U17W0G',
      is_channel: true,
      is_group: false,
      is_im: false,
      name: 'test1',
      is_shared: false,
      is_org_shared: false,
      is_ext_shared: false,
      is_private: false,
      is_mpim: false,
      pending_shared: [],
      is_pending_ext_shared: false,
    },
    type: 'message',
    user: 'USZ43DGBE',
    username: 'novikovseregka',
    ts: '1583606211.001200',
    blocks: [{
      type: 'rich_text',
      block_id: 'piFN',
      elements: [{
        type: 'rich_text_section',
        elements: [{
          type: 'text',
          text: 'What if I will write a long test text,\ncontaining many lines?\nWill the search api return all the text,\nor it will shrink it?\nInteresting.\nText should be long enough already.\nNo one writes to slack more anyway)',
        }],
      }],
    }],
    text: 'What if I will write a long test text,\ncontaining many lines?\nWill the search api return all the text,\nor it will shrink it?\nInteresting.\nText should be long enough already.\nNo one writes to slack more anyway)',
    permalink: 'https://loocle.slack.com/archives/CT3U17W0G/p1583606211001200',
    no_reactions: true,
    previous: {
      type: 'message',
      user: 'USZ43DGBE',
      username: 'novikovseregka',
      ts: '1579953722.000700',
      blocks: [{
        type: 'rich_text',
        block_id: 'JWi',
        elements: [{
          type: 'rich_text_section',
          elements: [{type: 'text', text: 'more than one test word'}],
        }],
      }],
      text: 'more than one test word',
      iid: '6ec1f807-ca45-487a-959a-753f83b5eda2',
      permalink: 'https://loocle.slack.com/archives/CT3U17W0G/p1579953722000700',
    },
    previous_2: {
      type: 'message',
      user: 'USZ43DGBE',
      username: 'novikovseregka',
      ts: '1579953675.000400',
      blocks: [{
        type: 'rich_text',
        block_id: 'npmN',
        elements: [{type: 'rich_text_section', elements: [{type: 'text', text: 'test1'}]}],
      }],
      text: 'test1',
      iid: '75cf427d-898f-48b3-9af5-6d08acdc46cc',
      permalink: 'https://loocle.slack.com/archives/CT3U17W0G/p1579953675000400',
    },
  }, {
    iid: '3f1ea953-5b23-4de7-9f78-c3a7df15f453',
    team: 'TSZHFF2LQ',
    channel: {
      id: 'CT3U1AEHE',
      is_channel: true,
      is_group: false,
      is_im: false,
      name: 'test2',
      is_shared: false,
      is_org_shared: false,
      is_ext_shared: false,
      is_private: false,
      is_mpim: false,
      pending_shared: [],
      is_pending_ext_shared: false,
    },
    type: 'message',
    user: 'USZ43DGBE',
    username: 'novikovseregka',
    ts: '1579953670.000400',
    blocks: [{
      type: 'rich_text',
      block_id: 'qmqR',
      elements: [{type: 'rich_text_section', elements: [{type: 'text', text: 'test2'}]}],
    }],
    text: 'test2',
    permalink: 'https://loocle.slack.com/archives/CT3U1AEHE/p1579953670000400',
    no_reactions: true,
  }],
};
const zeroPosts: object = {
  matches: [],
  total: 0,
};
const authTestResponse: IAuthTestResponse = {
  ok: true,
  url: 'https://subarachnoid.slack.com/',
  team: 'Subarachnoid Workspace',
  user: 'bot',
  team_id: 'T0G9PQBBK',
  user_id: 'W23456789',
  bot_id: 'BZYBOTHED',
};
