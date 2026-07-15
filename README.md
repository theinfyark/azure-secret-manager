# azure-secret-manager

Tiny helper for **Azure Key Vault** secrets — the API companies actually want.

```bash
npm install azure-secret-manager
```

## Usage

```js
import { AzureSecrets } from "azure-secret-manager";

const secrets = new AzureSecrets();

const password = await secrets.get("DB_PASSWORD");
```

Set the vault once:

```bash
export AZURE_KEY_VAULT_URL=https://my-vault.vault.azure.net
```

Or pass it in:

```js
const secrets = new AzureSecrets({
  vaultUrl: "https://my-vault.vault.azure.net",
  // or just: vaultUrl: "my-vault"
});
```

## Auth

Uses Azure **`DefaultAzureCredential`** under the hood, so it works with:

- Azure CLI (`az login`)
- Managed Identity (App Service, AKS, VMs)
- Environment variables (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`)
- Visual Studio Code / Azure PowerShell sign-in

No custom auth code needed for most company setups.

## API

### `get(name)`

```js
await secrets.get("DB_PASSWORD");
```

### `getMany(names)`

```js
const { DB_PASSWORD, API_KEY } = await secrets.getMany([
  "DB_PASSWORD",
  "API_KEY",
]);
```

### `set(name, value)`

```js
await secrets.set("ROTATED_KEY", "new-value");
```

### Caching

Enabled by default (5 minutes). Disable or tune:

```js
const secrets = new AzureSecrets({
  vaultUrl: "my-vault",
  cache: true,
  cacheTtlMs: 60_000,
});

secrets.clearCache();        // all
secrets.clearCache("API_KEY"); // one
```

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `vaultUrl` | `AZURE_KEY_VAULT_URL` | Full URL or vault name |
| `credential` | `DefaultAzureCredential` | Custom Azure credential |
| `cache` | `true` | In-memory cache |
| `cacheTtlMs` | `300000` | Cache TTL |

## Errors

Failed reads throw `AzureSecretsError`:

```js
import { AzureSecrets, AzureSecretsError } from "azure-secret-manager";

try {
  await secrets.get("MISSING");
} catch (err) {
  if (err instanceof AzureSecretsError) {
    console.error(err.secretName, err.message);
  }
}
```

## Requirements

- Node.js 18+
- Access to an Azure Key Vault

## License

MIT
