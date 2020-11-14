import ConnectorError, { Json } from './ConnectorError';
import ErrorCode from './ErrorCode';
import Connector from './Connector';

export default class ErrorCodeConnectorError extends ConnectorError {
  private _errorCode: ErrorCode;

  constructor(errorCode: ErrorCode, connector: Connector, message?: string) {
    super(connector, message);
    this._errorCode = errorCode;
  }

  get errorCode(): ErrorCode {
    return this._errorCode;
  }

  toJSON(): Json {
    return Object.assign({}, super.toJSON(), {errorCode: this.errorCode});
  }
}
