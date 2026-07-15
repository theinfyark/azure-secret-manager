import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AzureSecrets, AzureSecretsError } from "../src/index.js";

function mockClient(store) {
  return {
    async getSecret(name) {
      if (!(name in store)) {
        const err = new Error("Secret not found");
        err.statusCode = 404;
        throw err;
      }
      return { value: store[name] };
    },
    async setSecret(name, value) {
      store[name] = value;
      return { value };
    },
  };
}

describe("AzureSecrets", () => {
  it("gets a secret: await secrets.get('DB_PASSWORD')", async () => {
    const secrets = new AzureSecrets({
      vaultUrl: "https://my-vault.vault.azure.net",
      client: mockClient({ DB_PASSWORD: "s3cret" }),
    });

    assert.equal(await secrets.get("DB_PASSWORD"), "s3cret");
  });

  it("caches secret values", async () => {
    let calls = 0;
    const client = {
      async getSecret() {
        calls += 1;
        return { value: "v1" };
      },
    };

    const secrets = new AzureSecrets({
      vaultUrl: "https://my-vault.vault.azure.net",
      client,
      cache: true,
    });

    await secrets.get("A");
    await secrets.get("A");
    assert.equal(calls, 1);

    secrets.clearCache("A");
    await secrets.get("A");
    assert.equal(calls, 2);
  });

  it("getMany returns a map of secrets", async () => {
    const secrets = new AzureSecrets({
      vaultUrl: "https://my-vault.vault.azure.net",
      client: mockClient({ A: "1", B: "2" }),
    });

    assert.deepEqual(await secrets.getMany(["A", "B"]), { A: "1", B: "2" });
  });

  it("set writes and caches", async () => {
    const store = {};
    const secrets = new AzureSecrets({
      vaultUrl: "https://my-vault.vault.azure.net",
      client: mockClient(store),
    });

    await secrets.set("TOKEN", "abc");
    assert.equal(store.TOKEN, "abc");
    assert.equal(await secrets.get("TOKEN"), "abc");
  });

  it("accepts vault name and builds URL", () => {
    const secrets = new AzureSecrets({
      vaultUrl: "contoso-vault",
      client: mockClient({}),
    });
    assert.equal(secrets.vaultUrl, "https://contoso-vault.vault.azure.net");
  });

  it("throws AzureSecretsError when missing", async () => {
    const secrets = new AzureSecrets({
      vaultUrl: "https://my-vault.vault.azure.net",
      client: mockClient({}),
    });

    await assert.rejects(
      () => secrets.get("MISSING"),
      (err) => err instanceof AzureSecretsError && /MISSING/.test(err.message),
    );
  });

  it("requires vault url", () => {
    const prev = process.env.AZURE_KEY_VAULT_URL;
    delete process.env.AZURE_KEY_VAULT_URL;
    try {
      assert.throws(
        () => new AzureSecrets({ client: mockClient({}) }),
        (err) => err instanceof AzureSecretsError,
      );
    } finally {
      if (prev !== undefined) process.env.AZURE_KEY_VAULT_URL = prev;
    }
  });
});
