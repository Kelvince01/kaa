export const SECURITY_CONFIG = {
  /**
   * Name of the CSRF token cookie
   */
  csrfCookieName: "csrf",

  /**
   * Name of the CSRF token header
   */
  csrfHeaderName: "x-csrf-token",

  /**
   * Name of the session ID cookie
   */
  sessionCookieName: "sessionId",

  /**
   * Session expiration time in seconds (24 hours)
   */
  sessionMaxAge: 86_400,
};
