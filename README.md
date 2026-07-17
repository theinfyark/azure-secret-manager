# azure-secret-manager

Tiny helper for **Azure Key Vault** secrets — the API companies actually want.

```bash
npm install azure-secret-manager
```

## Quick Start

## Usage

```js
import { AzureSecrets } from 'azure-secret-manager';

const secrets = new AzureSecrets();

const password = await secrets.get('DB_PASSWORD');
```

Set the vault once:

```bash
export AZURE_KEY_VAULT_URL=https://my-vault.vault.azure.net
```

Or pass it in:

```js
const secrets = new AzureSecrets({
  vaultUrl: 'https://my-vault.vault.azure.net',
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
await secrets.get('DB_PASSWORD');
```

### `getMany(names)`

```js
const { DB_PASSWORD, API_KEY } = await secrets.getMany([
  'DB_PASSWORD',
  'API_KEY',
]);
```

### `set(name, value)`

```js
await secrets.set('ROTATED_KEY', 'new-value');
```

### Caching

Enabled by default (5 minutes). Disable or tune:

```js
const secrets = new AzureSecrets({
  vaultUrl: 'my-vault',
  cache: true,
  cacheTtlMs: 60_000,
});

secrets.clearCache(); // all
secrets.clearCache('API_KEY'); // one
```

## Options

| Option       | Default                  | Description             |
| ------------ | ------------------------ | ----------------------- |
| `vaultUrl`   | `AZURE_KEY_VAULT_URL`    | Full URL or vault name  |
| `credential` | `DefaultAzureCredential` | Custom Azure credential |
| `cache`      | `true`                   | In-memory cache         |
| `cacheTtlMs` | `300000`                 | Cache TTL               |

## Errors

Failed reads throw `AzureSecretsError`:

```js
import { AzureSecrets, AzureSecretsError } from 'azure-secret-manager';

try {
  await secrets.get('MISSING');
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

## Introduction

**azure-secret-manager** helps you ship reliable Node.js / TypeScript applications with a small, focused API.

## Why this package exists

Popular stacks need small, trustworthy utilities with excellent DX. **azure-secret-manager** exists to solve one problem well: clear APIs, strong typing, minimal dependencies, and production-ready defaults — without the overhead of larger frameworks.

## Installation

```bash
npm install azure-secret-manager
# or
pnpm add azure-secret-manager
yarn add azure-secret-manager
```

Requires Node.js 18+.

## API Reference

See the exports from `azure-secret-manager` and the inline TypeScript types for the full surface area. Primary entry points are documented in **Quick Start** and **Examples** above.

## Examples

Minimal usage is shown in **Quick Start**. Prefer copying those snippets first, then expand into your app’s error handling and configuration patterns.

## Advanced Examples

- Combine with environment validation, logging, and health checks in production services
- Prefer dependency injection / custom `fetch` / client injection in tests
- Keep configuration explicit; avoid hidden global state

## Framework Integration

Works with Express, Fastify, Hono, NestJS, and plain Node HTTP servers. Import ESM (or CJS where published) and call the documented APIs from route handlers, middleware, or background jobs.

## TypeScript Usage

```ts
import { AzureSecrets, AzureSecretsError } from 'azure-secret-manager';
```

Types ship with the package (`types` / `exports.types`). Enable `strict` in your `tsconfig` for the best DX.

## Error Handling

- Fail fast with typed / named errors where provided
- Never swallow errors silently in production paths
- Prefer returning structured error payloads in HTTP layers
- Surface actionable messages (what failed + how to fix)

## Performance

- Minimal runtime work on the hot path
- Avoid unnecessary allocations and dependencies
- Tree-shakeable ESM entry points
- Prefer streaming / lazy work when dealing with large payloads

## Best Practices

- Pin major versions with SemVer ranges you trust
- Validate configuration at process startup
- Add health checks and observability around I/O
- Write tests for failure modes (timeouts, bad input, missing credentials)

## FAQ

**Does it work with ESM and CommonJS?**  
Yes where the package publishes dual exports. Prefer ESM for new projects.

**Is it production-ready?**  
Yes — tests, types, and SemVer releases are part of the maintenance model.

**How do I report a bug?**  
Open a GitHub issue using the bug template.

## Migration Guide

### From 0.x / early drafts

This package follows SemVer. Breaking changes land in major releases and are called out in `CHANGELOG.md`.

### Upgrading patch/minor

Patch and minor releases are backward compatible. Run your test suite after upgrading.

## Troubleshooting

| Symptom                   | Likely cause                         | Fix                                  |
| ------------------------- | ------------------------------------ | ------------------------------------ |
| `ERR_MODULE_NOT_FOUND`    | Wrong Node version / bad import path | Use Node 18+ and package `exports`   |
| Types not resolving       | Old moduleResolution                 | Use `bundler` or `node16`+           |
| Auth / network failures   | Missing env or blocked egress        | Check credentials and firewall       |
| Unexpected runtime errors | Invalid input                        | Validate options; read error message |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). PRs with tests and docs are welcome.
