import Connector from "./Connector";

export default class Github extends Connector {
  static DEFAULT_ORIGIN: string | null = 'https://github.com';

  constructor(origin: string | null = Github.DEFAULT_ORIGIN) {
    super(origin);
  }
}
