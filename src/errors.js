export class AzureSecretsError extends Error {
  /**
   * @param {string} message
   * @param {{ cause?: unknown, name?: string }} [options]
   */
  constructor(message, options = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "AzureSecretsError";
    /** @type {string | undefined} */
    this.secretName = options.name;
  }
}
