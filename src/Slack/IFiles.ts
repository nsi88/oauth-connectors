import IFileMatch from './IFileMatch';

/**
 * Structure contained in WebAPICallResult.files
 */
export default interface IFiles {
  total: number;
  pagination: Object;
  paging: Object;
  matches: Array<IFileMatch>;
}
