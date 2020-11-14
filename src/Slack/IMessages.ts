/**
 * Structure contained in WebAPICallResult.messages
 */
import IMessageMatch from './IMessageMatch';

export default interface IMessages {
  total: number;
  pagination: Object;
  paging: Object;
  matches: Array<IMessageMatch>;
}
