import { OAuth } from 'oauth';
import loadEnvVariable from '../loadEnvVariable';
import * as assert from 'assert';

class OAuthConsumer extends OAuth {
  private static privateKeyData = loadEnvVariable('OAUTH_CONFLUENCE_PRIVATE_KEY_DATA');
  private static consumerKey = loadEnvVariable('OAUTH_CONFLUENCE_CONSUMER_KEY');
  private static consumerSecret = loadEnvVariable('OAUTH_CONFLUENCE_CONSUMER_SECRET');
  private static oauthVersion = '1.0';
  private static signatureMethod = 'RSA-SHA1';
  // NOTE: Default nonce value (32) is used if it's not setup in here.
  private static nonceSize = null;

  constructor(
      requestUrl: string,
      accessUrl: string,
      authorizeCallback: string | null,
  ) {
    assert(OAuthConsumer.privateKeyData !== undefined && OAuthConsumer.consumerKey !== undefined &&
        OAuthConsumer.consumerSecret !== undefined,
        'OAUTH_CONFLUENCE_PRIVATE_KEY_DATA, OAUTH_CONFLUENCE_CONSUMER_KEY, OAUTH_CONFLUENCE_CONSUMER_SECRET should be setup');
    super(requestUrl, accessUrl, OAuthConsumer.consumerKey as string, OAuthConsumer.consumerSecret as string,
        OAuthConsumer.oauthVersion, authorizeCallback, OAuthConsumer.signatureMethod,
        OAuthConsumer.nonceSize, OAuthConsumer.privateKeyData as string);
  }
}

export default OAuthConsumer;
