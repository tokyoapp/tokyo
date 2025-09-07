/**
 * Global constants for application configuration set at compile time.
 */
export class Config {
  static get env() {
    return {
      VERSION: import.meta.env.VERSION,
    };
  }
}
