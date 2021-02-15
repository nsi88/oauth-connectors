/**
 * Base Connector class.
 *
 * Connector is an entity used to "connect" our service with another origin of information.
 * The origin can be a whatever service supporting search and optionally having an authorisation.
 */
export default abstract class Connector {
  static DEFAULT_ORIGIN: string | null = null;
  /**
   * Origin field should contain protocol, host and port.
   * See the format description in README.
   */
  origin: string;

  constructor(origin: string | null, ..._args: any) {
    // TODO: Validate origin format
    if (origin === null) {
      throw new Error('Can\'t find origin for ' + this.constructor.name);
    }
    this.origin = origin;
  }
}
