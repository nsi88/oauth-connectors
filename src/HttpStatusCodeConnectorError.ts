import ConnectorError, { Json } from './ConnectorError';
import Connector from './Connector';

export default class HttpStatusCodeConnectorError extends ConnectorError {
  private _httpStatusCode: number;

  constructor(httpStatusCode: number, connector: Connector, message?: string) {
    super(connector, message);
    this._httpStatusCode = httpStatusCode;
  }

  get httpStatusCode(): number {
    return this._httpStatusCode;
  }

  toJSON(): Json {
    return Object.assign({}, super.toJSON(), {httpStatusCode: this.httpStatusCode});
  }
}
