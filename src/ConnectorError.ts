import { Connector } from '../index';

export type Json = { [name: string]: any };

export default class ConnectorError extends Error {
  private readonly _connector: Connector;

  constructor(connector: Connector, message?: string) {
    super(message);
    this._connector = connector;
  }

  get connector(): Connector {
    return this._connector;
  }

  toJSON(): Json {
    return {
      connector: this.connector,
      message: this.message,
    };
  }
}
