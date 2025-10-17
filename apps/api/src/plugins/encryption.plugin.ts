import Elysia from "elysia";
import { E2EEncryption } from "~/services/encryption.service";
import type { EncryptedPayload } from "~/types/encryption.type";

type EncryptionOptions = {
  encryptionKey?: CryptoKey;
  publicKey?: CryptoKey;
  privateKey?: CryptoKey;
};

const initEncOptions: EncryptionOptions = {
  encryptionKey: undefined,
  publicKey: undefined,
  privateKey: undefined,
};

/**
 * Middleware to initialize encryption keys for the application
 */
export const encryptionKeysPlugin = new Elysia({ name: "encryptionKeys" })
  .state("encryptionKeys", initEncOptions)
  .onBeforeHandle(async ({ store }) => {
    if (!store.encryptionKeys.encryptionKey) {
      // Generate and store encryption key
      store.encryptionKeys.encryptionKey = await E2EEncryption.generateKey();

      // Generate signing keys
      const { publicKey, privateKey } =
        await E2EEncryption.generateSigningKeyPair();
      store.encryptionKeys.publicKey = publicKey;
      store.encryptionKeys.privateKey = privateKey;

      console.log("Encryption keys generated and stored in application");
    }
  });

// Define the encryption store interface
type EncryptionStore = {
  decryptedData: any;
};

const initEncStore: EncryptionStore = {
  decryptedData: null,
};

export const encryptionPlugin = (app: Elysia) =>
  app
    .use(encryptionKeysPlugin)
    .state("encryption", initEncStore)
    .onBeforeHandle(async ({ set, store, request }) => {
      try {
        // Get encrypted payload from body
        const encryptedPayload: EncryptedPayload = await request.json();

        // Verify signature first
        const isValid = await E2EEncryption.verifySignature(
          encryptedPayload,
          store.encryptionKeys.publicKey as CryptoKey // Assuming key is stored in app settings
        );

        if (!isValid) {
          set.status = 401;
          return { error: "Invalid signature" };
        }

        // Decrypt the payload
        const decryptedData = await E2EEncryption.decrypt(
          encryptedPayload,
          store.encryptionKeys.encryptionKey as CryptoKey
        );

        store.encryption.decryptedData = decryptedData;
      } catch (error) {
        console.error("Request encryption error:", error);
        set.status = 500;
        return { error: "Encryption error" };
      }
    })
    .onAfterHandle(async ({ response, store }) => {
      // Only encrypt JSON responses
      if (
        response instanceof Response &&
        response.headers.get("content-type")?.includes("application/json")
      ) {
        const data = await response.clone().json();
        const encryptedResponse = await E2EEncryption.encrypt(
          data,
          store.encryptionKeys.encryptionKey as CryptoKey
        );
        return Response.json(encryptedResponse);
      }
      return response;
    })
    .derive(({ store }) => ({
      getDecryptedData: () => store.encryption.decryptedData,
      getPublicKey: () => store.encryptionKeys.publicKey,
    }));
