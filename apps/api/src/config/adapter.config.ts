export enum TableName {
  App = "apps",
  User = "users",
  UserAppConsent = "user_app_consents",
  Role = "roles",
  Permission = "permissions",
  UserRole = "user_roles",
  UserPasskey = "user_passkeys",
  Scope = "scopes",
  AppScope = "app_scopes",
  ScopeLocale = "scope_locales",
  Org = "organizations",
  EmailLog = "email_logs",
  SmsLog = "sms_logs",
  SignInLog = "sign_in_logs",
}

export enum BaseKVKey {
  JwtPublicSecret = "jwtPublicSecret",
  DeprecatedJwtPublicSecret = "deprecatedJwtPublicSecret",
  JwtPrivateSecret = "jwtPrivateSecret",
  DeprecatedJwtPrivateSecret = "deprecatedJwtPrivateSecret",
  SessionSecret = "sessionSecret",
  RefreshToken = "RT",
  AuthCode = "AC",
  EmailMfaCode = "EMC",
  OtpMfaCode = "OMC",
  SmsMfaCode = "SMC",
  EmailVerificationCode = "EVC",
  PasskeyEnrollChallenge = "PEC",
  PasskeyVerifyChallenge = "PVC",
  PasswordResetCode = "PRC",
  FailedLoginAttempts = "FLA",
  FailedOtpMfaAttempts = "FMA",
  SmsMfaMessageAttempts = "SMMA",
  EmailMfaEmailAttempts = "EMEA",
  PasswordResetAttempts = "PRA",
  ChangeEmailCode = "CEC",
  ChangeEmailAttempts = "CEA",
}

export const getKVKey = (
  base: BaseKVKey,
  key1: string,
  key2?: string
): string => {
  const baseKey = `${base}-${key1}`;
  return key2 ? `${baseKey}-${key2}` : baseKey;
};

export enum SessionKey {
  AuthInfo = "authInfo",
}

export const getAuthInfoSessionKeyByClientId = (clientId: string) =>
  `${SessionKey.AuthInfo}-${clientId}`;

export enum FileLocation {
  NodePublicKey = "node_jwt_public_key.pem",
  NodePrivateKey = "node_jwt_private_key.pem",
  NodeDeprecatedPrivateKey = "node_deprecated_jwt_private_key.pem",
  NodeDeprecatedPublicKey = "node_deprecated_jwt_public_key.pem",
}
