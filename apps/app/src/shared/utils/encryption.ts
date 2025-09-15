export class ClientEncryption {
  private encryptionKey: CryptoKey | null = null;
  private publicKey: CryptoKey | null = null;
  private privateKey: CryptoKey | null = null;

  // Initialize encryption keys
  async initialize() {
    // Generate or fetch encryption key
    this.encryptionKey = await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );

    // Generate signing keys
    const keyPair = (await crypto.subtle.generateKey(
      {
        name: "RSA-PSS",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    )) as CryptoKeyPair;

    this.publicKey = keyPair.publicKey;
    this.privateKey = keyPair.privateKey;
  }

  // Encrypt data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async encrypt(data: any): Promise<{
    iv: string;
    encryptedData: string;
    signature: string;
  }> {
    if (!(this.encryptionKey && this.privateKey)) {
      throw new Error("Encryption not initialized");
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      this.encryptionKey,
      encodedData
    );

    const payload = {
      iv: this.arrayBufferToBase64(iv.buffer),
      encryptedData: this.arrayBufferToBase64(encryptedData),
      signature: "",
    };

    // Sign the payload
    const dataToSign = payload.iv + payload.encryptedData;
    const signature = await crypto.subtle.sign(
      {
        name: "RSA-PSS",
        saltLength: 32,
      },
      this.privateKey,
      new TextEncoder().encode(dataToSign)
    );

    payload.signature = this.arrayBufferToBase64(signature);
    return payload;
  }

  // Decrypt response
  async decrypt(encryptedResponse: {
    iv: string;
    encryptedData: string;
    signature: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    if (!this.encryptionKey) {
      throw new Error("Encryption not initialized");
    }

    const iv = this.base64ToArrayBuffer(encryptedResponse.iv);
    const encryptedData = this.base64ToArrayBuffer(
      encryptedResponse.encryptedData
    );

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      this.encryptionKey,
      encryptedData
    );

    return JSON.parse(new TextDecoder().decode(decryptedData));
  }

  // Utility functions
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      // biome-ignore lint/style/noNonNullAssertion: false positive
      binary += String.fromCharCode(bytes[i]!);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Create a singleton instance
export const clientEncryption = new ClientEncryption();
