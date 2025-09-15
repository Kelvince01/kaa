import type { AxiosPromise } from "axios";

export class RequestDeduplication {
  private readonly pendingRequests = new Map<string, AxiosPromise>();

  generateKey(method: string, url: string, data?: any): string {
    const dataStr = data ? JSON.stringify(data) : "";
    return `${method.toUpperCase()}:${url}:${btoa(dataStr)}`;
  }

  getPendingRequest(key: string): AxiosPromise | null {
    return this.pendingRequests.get(key) || null;
  }

  addPendingRequest(key: string, promise: AxiosPromise): AxiosPromise {
    this.pendingRequests.set(key, promise);

    // Clean up when request completes
    promise
      .finally(() => {
        this.pendingRequests.delete(key);
      })
      .catch(() => {
        // Ignore errors here, they'll be handled by the original caller
      });

    return promise;
  }

  hasPendingRequest(key: string): boolean {
    return this.pendingRequests.has(key);
  }

  clear(): void {
    this.pendingRequests.clear();
  }

  size(): number {
    return this.pendingRequests.size;
  }
}
