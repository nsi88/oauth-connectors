import ISearchResultLink from './ISearchResultLink';
import IUserResponse from './IUserResponse';

/**
 * ConfluenceServer search result structure. Part of search response
 */
export default interface ISearchResult {
  id: string;
  // TODO: define possible values for type, status, ...
  type: string;
  status: string;
  title: string;
  body?: IBody;
  restrictions: Object;
  _links: ISearchResultLink;
  _expandable: Object;
  version?: IVersion;
}

interface IBody {
  view: IBodyView;
}

interface IBodyView {
  representation: string;
  value: string;
}

interface IVersion {
  by: IUserResponse;
  when: string; // e.g. "2020-05-04T12:39:18.283Z"
}
