import { ForbiddenError, genTotp, redisClient } from "@kaa/utils";
import * as adapterConfig from "~/config/adapter.config";
import * as localeConfig from "~/config/locale.config";
import type { AuthCodeBody } from "~/features/auth/auth.type";

export type RefreshTokenBody = {
  authId: string;
  clientId: string;
  scope: string;
  roles: string[];
};

export const getSessionSecret = async (): Promise<string> => {
  const secretInRedis = await redisClient.get(
    adapterConfig.BaseKVKey.SessionSecret
  );
  if (!secretInRedis) throw new ForbiddenError();
  return secretInRedis;
};

export const getJwtPrivateSecret = async (): Promise<string> => {
  const secretInRedis = await redisClient.get(
    adapterConfig.BaseKVKey.JwtPrivateSecret
  );
  if (!secretInRedis) throw new ForbiddenError();
  return secretInRedis;
};

export const getJwtPublicSecret = async (): Promise<string> => {
  const secretInRedis = await redisClient.get(
    adapterConfig.BaseKVKey.JwtPublicSecret
  );
  if (!secretInRedis) throw new ForbiddenError();
  return secretInRedis;
};

export const getDeprecatedPublicSecret = async (): Promise<string | null> =>
  await redisClient.get(adapterConfig.BaseKVKey.DeprecatedJwtPublicSecret);

export const storeAuthCode = async (
  authCode: string,
  authCodeBody: AuthCodeBody,
  expiresIn: number
) => {
  await redisClient.setEx(
    adapterConfig.getKVKey(adapterConfig.BaseKVKey.AuthCode, authCode),
    expiresIn,
    JSON.stringify(authCodeBody)
  );
};

export const getAuthCodeBody = async (
  authCode: string
): Promise<AuthCodeBody | false> => {
  const codeInRedis = await redisClient.get(
    adapterConfig.getKVKey(adapterConfig.BaseKVKey.AuthCode, authCode)
  );
  if (!codeInRedis) return false;
  const codeBody = JSON.parse(codeInRedis);
  if (!codeBody) return false;
  return codeBody;
};

export const storeRefreshToken = async (
  refreshToken: string,
  value: RefreshTokenBody,
  expiresIn: number
) => {
  await redisClient.setEx(
    adapterConfig.getKVKey(adapterConfig.BaseKVKey.RefreshToken, refreshToken),
    expiresIn,
    JSON.stringify(value)
  );
};

export const invalidRefreshToken = async (refreshToken: string) => {
  await redisClient.del(
    adapterConfig.getKVKey(adapterConfig.BaseKVKey.RefreshToken, refreshToken)
  );
};

export const getRefreshTokenBody = async (
  refreshToken: string
): Promise<RefreshTokenBody> => {
  const tokenInRedis = await redisClient.get(
    adapterConfig.getKVKey(adapterConfig.BaseKVKey.RefreshToken, refreshToken)
  );
  if (!tokenInRedis) {
    throw new ForbiddenError(localeConfig.Errors.WrongRefreshToken);
  }
  const tokenBody = JSON.parse(tokenInRedis);
  if (!tokenBody) {
    throw new ForbiddenError(localeConfig.Errors.WrongRefreshToken);
  }
  return tokenBody;
};

export const emailMfaCodeVerified = async (authCode: string) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.EmailMfaCode,
    authCode
  );
  const storedCode = await redisClient.get(key);
  return storedCode && storedCode === "1";
};

export const markEmailMfaVerified = async (
  authCode: string,
  expiresIn: number
) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.EmailMfaCode,
    authCode
  );
  await redisClient.setEx(key, expiresIn, "1");
  return true;
};

export const stampEmailMfaCode = async (
  authCode: string,
  mfaCode: string,
  expiresIn: number,
  isOtpFallback: boolean,
  isSmsFallback: boolean
) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.EmailMfaCode,
    authCode
  );
  const storedCode = await redisClient.get(key);

  const isValid = storedCode && storedCode === mfaCode;

  if (isValid) {
    let stampKey = key;
    if (isOtpFallback) {
      stampKey = adapterConfig.getKVKey(
        adapterConfig.BaseKVKey.OtpMfaCode,
        authCode
      );
    } else if (isSmsFallback) {
      stampKey = adapterConfig.getKVKey(
        adapterConfig.BaseKVKey.SmsMfaCode,
        authCode
      );
    }

    await redisClient.setEx(stampKey, expiresIn, "1");
  }
  return isValid;
};

export const stampSmsMfaCode = async (
  authCode: string,
  mfaCode: string,
  expiresIn: number
) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.SmsMfaCode,
    authCode
  );
  const storedCode = await redisClient.get(key);

  const isValid = storedCode && storedCode === mfaCode;

  if (isValid) {
    await redisClient.setEx(key, expiresIn, "1");
  }
  return isValid;
};

export const storeSmsMfaCode = async (
  authCode: string,
  mfaCode: string,
  expiresIn: number
) => {
  await redisClient.setEx(
    adapterConfig.getKVKey(adapterConfig.BaseKVKey.SmsMfaCode, authCode),
    expiresIn,
    mfaCode
  );
};

export const storeEmailMfaCode = async (
  authCode: string,
  mfaCode: string,
  expiresIn: number
) => {
  await redisClient.setEx(
    adapterConfig.getKVKey(adapterConfig.BaseKVKey.EmailMfaCode, authCode),
    expiresIn,
    mfaCode
  );
};

export const smsMfaCodeVerified = async (authCode: string) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.SmsMfaCode,
    authCode
  );
  const storedCode = await redisClient.get(key);
  return storedCode && storedCode === "1";
};

export const stampOtpMfaCode = async (
  authCode: string,
  mfaCode: string,
  otpSecret: string,
  expiresIn: number
) => {
  const otp = await genTotp(otpSecret);
  if (otp !== mfaCode) return false;

  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.OtpMfaCode,
    authCode
  );
  await redisClient.setEx(key, expiresIn, "1");
  return true;
};

export const optMfaCodeVerified = async (authCode: string) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.OtpMfaCode,
    authCode
  );
  const storedCode = await redisClient.get(key);
  return storedCode && storedCode === "1";
};

export const markSmsMfaVerified = async (
  authCode: string,
  expiresIn: number
) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.SmsMfaCode,
    authCode
  );
  await redisClient.setEx(key, expiresIn, "1");
  return true;
};

export const markOtpMfaVerified = async (
  authCode: string,
  expiresIn: number
) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.OtpMfaCode,
    authCode
  );
  await redisClient.setEx(key, expiresIn, "1");
  return true;
};

export const storeEmailVerificationCode = async (
  userId: string,
  code: string
) => {
  await redisClient.setEx(
    adapterConfig.getKVKey(
      adapterConfig.BaseKVKey.EmailVerificationCode,
      String(userId)
    ),
    7200,
    code
  );
};

export const verifyEmailVerificationCode = async (
  userId: string,
  code: string
) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.EmailVerificationCode,
    String(userId)
  );
  const storedCode = await redisClient.get(key);
  const isValid = storedCode && storedCode === code;
  if (isValid) await redisClient.del(key);
  return isValid;
};

export const storePasswordResetCode = async (userId: string, code: string) => {
  await redisClient.setEx(
    adapterConfig.getKVKey(
      adapterConfig.BaseKVKey.PasswordResetCode,
      String(userId)
    ),
    7200,
    code
  );
};

export const verifyPasswordResetCode = async (userId: string, code: string) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.PasswordResetCode,
    String(userId)
  );
  const storedCode = await redisClient.get(key);
  const isValid = storedCode && storedCode === code;
  if (isValid) await redisClient.del(key);
  return isValid;
};

export const getPasswordResetAttemptsByIP = async (
  email: string,
  ip?: string
) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.PasswordResetAttempts,
    email,
    ip
  );
  const stored = await redisClient.get(key);
  return stored ? Number(stored) : 0;
};

export const setPasswordResetAttemptsByIP = async (
  email: string,
  ip: string | undefined,
  count: number
) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.PasswordResetAttempts,
    email,
    ip
  );
  await redisClient.setEx(key, 86_400, String(count));
};

export const getFailedOtpMfaAttemptsByIP = async (
  userId: string,
  ip?: string
) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.FailedOtpMfaAttempts,
    String(userId),
    ip
  );
  const stored = await redisClient.get(key);
  return stored ? Number(stored) : 0;
};

export const setFailedOtpMfaAttempts = async (
  userId: string,
  ip: string | undefined,
  count: number
) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.FailedOtpMfaAttempts,
    String(userId),
    ip
  );
  await redisClient.setEx(key, 1800, String(count));
};

export const getSmsMfaMessageAttemptsByIP = async (
  userId: string,
  ip?: string
) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.SmsMfaMessageAttempts,
    String(userId),
    ip
  );
  const stored = await redisClient.get(key);
  return stored ? Number(stored) : 0;
};

export const setSmsMfaMessageAttempts = async (
  userId: string,
  ip: string | undefined,
  count: number
) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.SmsMfaMessageAttempts,
    String(userId),
    ip
  );
  await redisClient.setEx(key, 1800, String(count));
};

export const getEmailMfaEmailAttemptsByIP = async (
  userId: string,
  ip?: string
) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.SmsMfaMessageAttempts,
    String(userId),
    ip
  );
  const stored = await redisClient.get(key);
  return stored ? Number(stored) : 0;
};

export const setEmailMfaEmailAttempts = async (
  userId: string,
  ip: string | undefined,
  count: number
) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.SmsMfaMessageAttempts,
    String(userId),
    ip
  );
  await redisClient.setEx(key, 1800, String(count));
};

export const getFailedLoginAttemptsByIP = async (
  email: string,
  ip?: string
) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.FailedLoginAttempts,
    email,
    ip
  );
  const stored = await redisClient.get(key);
  return stored ? Number(stored) : 0;
};

export const setFailedLoginAttempts = async (
  email: string,
  ip: string | undefined,
  count: number,
  expiresIn: number
) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.FailedLoginAttempts,
    email,
    ip
  );
  await redisClient.setEx(key, expiresIn || 0, String(count));
};

export const clearFailedLoginAttemptsByIP = async (
  email: string,
  ip?: string
) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.FailedLoginAttempts,
    email,
    ip
  );
  await redisClient.del(key);
};

export const getLockedIPsByEmail = async (email: string) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.FailedLoginAttempts,
    email
  );
  const keys = await redisClient.keys(`${key}*`);
  return keys.map((storedKey) =>
    storedKey === key ? "" : storedKey.replace(`${key}-`, "")
  );
};

export const deleteLockedIPsByEmail = async (email: string) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.FailedLoginAttempts,
    email
  );
  const keys = await redisClient.keys(`${key}*`);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};

export const setPasskeyEnrollChallenge = async (
  userId: string,
  challenge: string
) => {
  await redisClient.setEx(
    adapterConfig.getKVKey(
      adapterConfig.BaseKVKey.PasskeyEnrollChallenge,
      String(userId)
    ),
    300,
    challenge
  );
};

export const getPasskeyEnrollChallenge = async (userId: string) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.PasskeyEnrollChallenge,
    String(userId)
  );
  return await redisClient.get(key);
};

export const setPasskeyVerifyChallenge = async (
  email: string,
  challenge: string
) => {
  await redisClient.setEx(
    adapterConfig.getKVKey(
      adapterConfig.BaseKVKey.PasskeyVerifyChallenge,
      email
    ),
    300,
    challenge
  );
};

export const getPasskeyVerifyChallenge = async (email: string) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.PasskeyVerifyChallenge,
    email
  );
  return await redisClient.get(key);
};

export const storeChangeEmailCode = async (
  userId: string,
  email: string,
  code: string
) => {
  await redisClient.setEx(
    adapterConfig.getKVKey(
      adapterConfig.BaseKVKey.ChangeEmailCode,
      String(userId),
      email
    ),
    7200,
    code
  );
};

export const verifyChangeEmailCode = async (
  userId: string,
  email: string,
  code: string
) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.ChangeEmailCode,
    String(userId),
    email
  );
  const storedCode = await redisClient.get(key);
  const isValid = storedCode && storedCode === code;
  if (isValid) await redisClient.del(key);
  return isValid;
};

export const getChangeEmailAttempts = async (email: string) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.ChangeEmailAttempts,
    email
  );
  const stored = await redisClient.get(key);
  return stored ? Number(stored) : 0;
};

export const setChangeEmailAttempts = async (email: string, count: number) => {
  const key = adapterConfig.getKVKey(
    adapterConfig.BaseKVKey.ChangeEmailAttempts,
    email
  );
  await redisClient.setEx(key, 1800, String(count));
};
