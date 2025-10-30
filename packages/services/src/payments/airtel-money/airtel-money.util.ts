import axios, { type AxiosResponse } from "axios";
import NodeRSA from "node-rsa";
import type {
  ApiResponse,
  EncryptionService,
  HttpClient,
} from "./airtel-money.type";

// Implementation of HttpClient using axios
export class AxiosHttpClient implements HttpClient {
  async request<T>(
    url: string,
    method: "GET" | "POST",
    headers: Record<string, string>,
    data?: any
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await axios({
        method,
        url,
        headers,
        data,
      });
      return {
        success: response.status === 200,
        data: response.data,
        status: response.status,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Request failed",
        status: error.response?.status || 500,
      };
    }
  }
}

// Implementation of EncryptionService using node-rsa
export class RsaEncryptionService implements EncryptionService {
  constructor(private readonly publicKey: string) {}

  encryptPin(rawPin: string): string {
    const key = new NodeRSA(this.publicKey, "pkcs8-public");
    key.setOptions({
      encryptionScheme: "pkcs1",
      signingScheme: "pkcs1-sha256",
    });
    const encrypted = key.encrypt(rawPin, "base64");
    return encrypted;
  }
}
