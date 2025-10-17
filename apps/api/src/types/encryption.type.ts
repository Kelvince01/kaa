/**
 * Interface for encrypted payload structure
 */
export type EncryptedPayload = {
  encryptedData: string; // Base64 encoded encrypted data
  iv: string; // Initialization vector
  signature: string; // Digital signature for verification
};

export type KeyPair = {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
};
