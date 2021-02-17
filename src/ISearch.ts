import SearchResult from './SearchResult';
import AuthCredentials from './AuthCredentials';

export default interface ISearch {
  /**
   * @param query - a query string.
   * @param authCredentials. See AuthCredentials.
   * @param additionalParameters. Connector specific parameters.
   */
  search<T extends AuthCredentials>(
      query: string,
      // TODO: authCredentials?: T instead of authCredentials: T | null
      authCredentials: T | null,
      additionalParameters?: { [key: string]: any },
  ): Promise<Array<SearchResult>>;
}
