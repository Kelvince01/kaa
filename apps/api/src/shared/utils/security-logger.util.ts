type SecurityEvent = {
  type:
    | "AUTH_FAILURE"
    | "RATE_LIMIT"
    | "PROGRESSIVE_RATE_LIMIT"
    | "SUSPICIOUS_ACTIVITY"
    | "TOKEN_REFRESH_FAILED"
    | "CSRF_VALIDATION_FAILED"
    | "REQUEST_SIGNATURE_INVALID";
  details: Record<string, any>;
  endpoint?: string;
  correlationId?: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
};

type SecurityLogger = {
  events: SecurityEvent[];
  maxEvents: number;
  alertThresholds: {
    criticalEvents: number;
    highEvents: number;
    timeWindow: number; // minutes
  };
};

const securityLogger: SecurityLogger = {
  events: [],
  maxEvents: 1000,
  alertThresholds: {
    criticalEvents: 5,
    highEvents: 10,
    timeWindow: 15,
  },
};

export function logSecurityEvent(event: SecurityEvent): void {
  // Add to events array
  securityLogger.events.push(event);

  // Keep only the most recent events
  if (securityLogger.events.length > securityLogger.maxEvents) {
    securityLogger.events = securityLogger.events.slice(
      -securityLogger.maxEvents
    );
  }

  // Log to console based on severity
  const logMessage = `[SECURITY ${event.severity.toUpperCase()}] ${event.type}: ${JSON.stringify(event.details)}`;

  switch (event.severity) {
    case "critical":
      console.error(logMessage, { correlationId: event.correlationId });
      break;
    case "high":
      console.warn(logMessage, { correlationId: event.correlationId });
      break;
    case "medium":
      console.warn(logMessage, { correlationId: event.correlationId });
      break;
    case "low":
      console.info(logMessage, { correlationId: event.correlationId });
      break;
    default:
      console.info(logMessage, { correlationId: event.correlationId });
      break;
  }

  // Check for alert conditions
  checkSecurityAlerts();
}

function checkSecurityAlerts(): void {
  const now = new Date();
  const windowStart = new Date(
    now.getTime() - securityLogger.alertThresholds.timeWindow * 60 * 1000
  );

  const recentEvents = securityLogger.events.filter(
    (event) => new Date(event.timestamp) >= windowStart
  );

  const criticalEvents = recentEvents.filter(
    (event) => event.severity === "critical"
  );
  const highEvents = recentEvents.filter((event) => event.severity === "high");

  // Trigger alerts if thresholds are exceeded
  if (criticalEvents.length >= securityLogger.alertThresholds.criticalEvents) {
    console.error(
      `[SECURITY ALERT] ${criticalEvents.length} critical security events in the last ${securityLogger.alertThresholds.timeWindow} minutes`
    );
  }

  if (highEvents.length >= securityLogger.alertThresholds.highEvents) {
    console.error(
      `[SECURITY ALERT] ${highEvents.length} high-severity security events in the last ${securityLogger.alertThresholds.timeWindow} minutes`
    );
  }
}

export function getSecurityEvents(
  severity?: SecurityEvent["severity"],
  limit = 100
): SecurityEvent[] {
  let events = securityLogger.events;

  if (severity) {
    events = events.filter((event) => event.severity === severity);
  }

  return events.slice(-limit);
}

export function getSecurityStats(): {
  totalEvents: number;
  eventsBySeverity: Record<string, number>;
  recentEvents: number;
  alertsTriggered: boolean;
} {
  const now = new Date();
  const windowStart = new Date(
    now.getTime() - securityLogger.alertThresholds.timeWindow * 60 * 1000
  );

  const recentEvents = securityLogger.events.filter(
    (event) => new Date(event.timestamp) >= windowStart
  );

  const eventsBySeverity = securityLogger.events.reduce(
    (acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const criticalEvents = recentEvents.filter(
    (event) => event.severity === "critical"
  );
  const highEvents = recentEvents.filter((event) => event.severity === "high");

  const alertsTriggered =
    criticalEvents.length >= securityLogger.alertThresholds.criticalEvents ||
    highEvents.length >= securityLogger.alertThresholds.highEvents;

  return {
    totalEvents: securityLogger.events.length,
    eventsBySeverity,
    recentEvents: recentEvents.length,
    alertsTriggered,
  };
}

export function clearSecurityEvents(): void {
  securityLogger.events = [];
}

export type { SecurityEvent };
