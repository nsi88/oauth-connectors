import OctokitFactory from './OctokitFactory';
import IOAuth2AccessTokenResponse from '../IOAuth2AccessTokenResponse';

describe('build', () => {
  const oAuth2AccessTokenResponse: IOAuth2AccessTokenResponse = {
    accessToken: 'accessToken',
    tokenType: 'tokenType',
    expiresIn: null,
    refreshToken: null,
    scope: null,
  };

  describe('cloud', () => {
    test.each([
      'https://github.com', 'https://github.com/', 'http://github.com/path',
    ])('returns Octokit instance', origin => {
      const octokit = OctokitFactory.build(origin, oAuth2AccessTokenResponse);
      expect(octokit.request.endpoint.DEFAULTS['baseUrl']).toStrictEqual('https://api.github.com');
      expect(octokit.request.endpoint.DEFAULTS['headers']['user-agent']).toContain('OAuthConnectors');
    });
  });

  describe('enterprise', () => {
    // TODO
  });
});
