import { ConfluenceServer } from '../index';
import { implementsIOAuth1 } from './IOAuth1';

describe('implementsIOAuth1', () => {

  test('object implementing IOAuth1', () => {
    const confluenceServer = new ConfluenceServer('https://confluence.yourdomain.com');
    expect(implementsIOAuth1(confluenceServer)).toBeTruthy();
  });

  test('object with missing IOAuth1 methods', () => {
    let confluenceServer: ConfluenceServer;
    for (const method of ['temporaryCredentialRequest', 'resourceOwnerAuthorizationURI', 'tokenCredentialsRequest']) {
      confluenceServer = new ConfluenceServer('https://confluence.yourdomain.com');
      delete Object.getPrototypeOf(confluenceServer)[method];
      expect(implementsIOAuth1(confluenceServer)).toBeFalsy();
    }
  });
});
