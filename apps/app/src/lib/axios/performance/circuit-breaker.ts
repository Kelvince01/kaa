import type { CircuitBreakerState } from "../types";

export type CircuitBreakerConfig = {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
};

export class CircuitBreaker {
  private readonly states = new Map<string, CircuitBreakerState>();
  private readonly config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  private getState(endpoint: string): CircuitBreakerState {
    if (!this.states.has(endpoint)) {
      this.states.set(endpoint, {
        state: "CLOSED",
        failureCount: 0,
        lastFailureTime: 0,
        nextRetryTime: 0,
      });
    }
    // biome-ignore lint/style/noNonNullAssertion: false positive
    return this.states.get(endpoint)!;
  }

  canExecute(endpoint: string): boolean {
    const state = this.getState(endpoint);
    const now = Date.now();

    switch (state.state) {
      case "CLOSED":
        return true;

      case "OPEN":
        if (now >= state.nextRetryTime) {
          state.state = "HALF_OPEN";
          return true;
        }
        return false;

      case "HALF_OPEN":
        return true;

      default:
        return true;
    }
  }

  onSuccess(endpoint: string): void {
    const state = this.getState(endpoint);

    if (state.state === "HALF_OPEN") {
      state.state = "CLOSED";
      state.failureCount = 0;
    } else if (state.state === "CLOSED") {
      state.failureCount = Math.max(0, state.failureCount - 1);
    }
  }

  onFailure(endpoint: string): void {
    const state = this.getState(endpoint);
    const now = Date.now();

    state.failureCount++;
    state.lastFailureTime = now;

    if (state.state === "HALF_OPEN") {
      state.state = "OPEN";
      state.nextRetryTime = now + this.config.recoveryTimeout;
    } else if (
      state.state === "CLOSED" &&
      state.failureCount >= this.config.failureThreshold
    ) {
      state.state = "OPEN";
      state.nextRetryTime = now + this.config.recoveryTimeout;
    }
  }

  getStats(): Record<string, CircuitBreakerState> {
    const stats: Record<string, CircuitBreakerState> = {};
    for (const [endpoint, state] of this.states.entries()) {
      stats[endpoint] = { ...state };
    }
    return stats;
  }

  reset(endpoint?: string): void {
    if (endpoint) {
      this.states.delete(endpoint);
    } else {
      this.states.clear();
    }
  }
}
