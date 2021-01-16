import AuthCredentials from './AuthCredentials';

/**
 * Interface of demo authorisation.
 *
 * Allows to authorise a user without his interaction using a demo account.
 */
export default interface IDemoAuth {
  demoAuth(): Promise<AuthCredentials>;
}

export function implementsIDemoAuth(object: any): object is IDemoAuth {
  return object && typeof object.demoAuth === 'function';
}
