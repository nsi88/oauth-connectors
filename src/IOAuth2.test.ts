import { Slack } from '../index';
import { implementsIOAuth2 } from './IOAuth2';

describe('implementsIOAuth2', () => {

  test('object implementing IOAuth2', () => {
    const slack = new Slack();
    expect(implementsIOAuth2(slack)).toBeTruthy();
  });

  test('object with missing IOAuth1 methods', () => {
    let slack: Slack;
    for (const method of ['authorizationRequest', 'accessTokenRequest']) {
      slack = new Slack();
      delete Object.getPrototypeOf(slack)[method];
      expect(implementsIOAuth2(slack)).toBeFalsy();
    }
  });
});
