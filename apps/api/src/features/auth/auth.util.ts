import config from "@kaa/config/api";

const isProduction = config.env === "production";

export type CookieName =
  | "session"
  | "oauth_state"
  | "oauth_code_verifier"
  | "oauth_redirect"
  | "oauth_connect_user_id"
  | "oauth_invite_token"
  | "passkey_challenge";
