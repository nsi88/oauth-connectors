import AuthCredentials from './AuthCredentials';

export default interface IFavorites {
  /**
   * Return list of ids of favorite resources of the user.
   */
  favorites<T extends AuthCredentials>(
      authCredentials: T | null,
      limit?: number,
  ): Promise<Array<string>>;
}

export function implementsIFavorites(object: any): object is IFavorites {
  return object && typeof object.favorites === 'function';
}
