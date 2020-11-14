import SearchResult from './SearchResult';
import AuthCredentials from './AuthCredentials';

export default interface ISearch {
  /**
   * @param query - a query string.
   * @param authCredentials. See AuthCredentials.
   */
  search<T extends AuthCredentials>(
      query: string,
      authCredentials: T | null,
  ): Promise<Array<SearchResult>>;
}
