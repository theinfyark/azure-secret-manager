export interface AzureSecretsErrorOptions {
  cause?: unknown;
  name?: string;
}

export declare class AzureSecretsError extends Error {
  name: "AzureSecretsError";
  secretName?: string;
  constructor(message: string, options?: AzureSecretsErrorOptions);
}

export interface SecretClientLike {
  getSecret(
    name: string,
    options?: { version?: string },
  ): Promise<{ value?: string | null }>;
  setSecret?(name: string, value: string): Promise<{ value?: string | null }>;
}

export interface TokenCredentialLike {
  getToken(
    scopes: string | string[],
    options?: unknown,
  ): Promise<{ token: string; expiresOnTimestamp: number } | null>;
}

export interface AzureSecretsOptions {
  vaultUrl?: string;
  credential?: TokenCredentialLike;
  client?: SecretClientLike;
  cache?: boolean;
  cacheTtlMs?: number;
}

export interface GetSecretOptions {
  version?: string;
  bypassCache?: boolean;
}

export declare class AzureSecrets {
  vaultUrl: string;
  cacheEnabled: boolean;
  cacheTtlMs: number;
  client: SecretClientLike;

  constructor(options?: AzureSecretsOptions);

  get(name: string, options?: GetSecretOptions): Promise<string>;
  getMany(names: string[]): Promise<Record<string, string>>;
  set(name: string, value: string): Promise<string>;
  clearCache(name?: string): void;
}
