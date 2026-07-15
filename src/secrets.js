import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { AzureSecretsError } from "./errors.js";

/**
 * Azure Key Vault name rules: alphanumeric and hyphens.
 * @param {string} name
 */
function assertSecretName(name) {
  if (typeof name !== "string" || !name.trim()) {
    throw new AzureSecretsError("Secret name must be a non-empty string");
  }
}

/**
 * Normalize vault URL.
 * Accepts full URL or vault name.
 * @param {string} vault
 */
function resolveVaultUrl(vault) {
  if (!vault || typeof vault !== "string") {
    throw new AzureSecretsError(
      "Vault URL is required. Pass vaultUrl or set AZURE_KEY_VAULT_URL.",
    );
  }

  const trimmed = vault.trim().replace(/\/$/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}.vault.azure.net`;
}

/**
 * Tiny Azure Key Vault helper.
 *
 * @example
 * ```js
 * const secrets = new AzureSecrets();
 * const password = await secrets.get("DB_PASSWORD");
 * ```
 */
export class AzureSecrets {
  /**
   * @param {{
   *   vaultUrl?: string,
   *   credential?: import('@azure/core-auth').TokenCredential,
   *   client?: { getSecret: Function, setSecret?: Function },
   *   cache?: boolean,
   *   cacheTtlMs?: number
   * }} [options]
   */
  constructor(options = {}) {
    const vaultUrl = resolveVaultUrl(
      options.vaultUrl ?? process.env.AZURE_KEY_VAULT_URL ?? "",
    );

    this.vaultUrl = vaultUrl;
    this.cacheEnabled = options.cache !== false;
    this.cacheTtlMs = options.cacheTtlMs ?? 5 * 60 * 1000;

    /** @type {Map<string, { value: string, expiresAt: number }>} */
    this._cache = new Map();

    if (options.client) {
      this.client = options.client;
    } else {
      const credential = options.credential ?? new DefaultAzureCredential();
      this.client = new SecretClient(vaultUrl, credential);
    }
  }

  /**
   * @param {string} name
   * @returns {string | undefined}
   */
  _fromCache(name) {
    if (!this.cacheEnabled) return undefined;
    const hit = this._cache.get(name);
    if (!hit) return undefined;
    if (Date.now() > hit.expiresAt) {
      this._cache.delete(name);
      return undefined;
    }
    return hit.value;
  }

  /**
   * @param {string} name
   * @param {string} value
   */
  _toCache(name, value) {
    if (!this.cacheEnabled) return;
    this._cache.set(name, {
      value,
      expiresAt: Date.now() + this.cacheTtlMs,
    });
  }

  /**
   * Get a secret value by name.
   *
   * @param {string} name
   * @param {{ version?: string, bypassCache?: boolean }} [options]
   * @returns {Promise<string>}
   */
  async get(name, options = {}) {
    assertSecretName(name);

    if (!options.bypassCache) {
      const cached = this._fromCache(name);
      if (cached !== undefined) return cached;
    }

    try {
      const result = await this.client.getSecret(name, {
        version: options.version,
      });
      const value = result?.value;
      if (value == null) {
        throw new AzureSecretsError(`Secret "${name}" has no value`, { name });
      }
      this._toCache(name, value);
      return value;
    } catch (err) {
      if (err instanceof AzureSecretsError) throw err;
      throw new AzureSecretsError(`Failed to get secret "${name}"`, {
        cause: err,
        name,
      });
    }
  }

  /**
   * Get many secrets. Returns an object keyed by secret name.
   *
   * @param {string[]} names
   * @returns {Promise<Record<string, string>>}
   */
  async getMany(names) {
    if (!Array.isArray(names)) {
      throw new AzureSecretsError("getMany() expects an array of secret names");
    }
    /** @type {Record<string, string>} */
    const out = {};
    await Promise.all(
      names.map(async (name) => {
        out[name] = await this.get(name);
      }),
    );
    return out;
  }

  /**
   * Set / update a secret (requires write permissions on the vault).
   *
   * @param {string} name
   * @param {string} value
   * @returns {Promise<string>}
   */
  async set(name, value) {
    assertSecretName(name);
    if (typeof value !== "string") {
      throw new AzureSecretsError("Secret value must be a string", { name });
    }
    if (typeof this.client.setSecret !== "function") {
      throw new AzureSecretsError("Underlying client does not support setSecret");
    }

    try {
      const result = await this.client.setSecret(name, value);
      const stored = result?.value ?? value;
      this._toCache(name, stored);
      return stored;
    } catch (err) {
      throw new AzureSecretsError(`Failed to set secret "${name}"`, {
        cause: err,
        name,
      });
    }
  }

  /** Clear in-memory cache (all or one secret). */
  clearCache(name) {
    if (name) this._cache.delete(name);
    else this._cache.clear();
  }
}
