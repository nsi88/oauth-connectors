import AuthCredentials from './AuthCredentials';
import IUser from './IUser';

export default interface ICurrentUser {
  currentUser<T extends AuthCredentials>(authCredentials: T | null): Promise<IUser>;
}

export function implementsICurrentUser(object: any): object is ICurrentUser {
  return object && typeof object.currentUser === 'function';
}
