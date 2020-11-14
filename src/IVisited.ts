import AuthCredentials from './AuthCredentials';

export default interface IVisited {
  /**
   * Return list of ids of resources visited by the user.
   *
   * The choice in here is to return ids or links.
   * Links might y easier to implement, because at the moment we already return them.
   * But ids are shorter. Considering that we might need to store a lot of resources in the history
   * on a user device, ids look a better option.
   */
  visited<T extends AuthCredentials>(
      authCredentials: T | null,
      limit?: number,
  ): Promise<Array<string>>;
}

export function implementsIVisited(object: any): object is IVisited {
  return object && typeof object.visited === 'function';
}
