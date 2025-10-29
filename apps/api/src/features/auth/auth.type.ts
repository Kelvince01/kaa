import type { IOTP, IUser } from "@kaa/models/types";

export type Locale = "en" | "sw";

export type GetAuthorizeReqDto = {
  clientId: string;
  redirectUri: string;
  responseType: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  authorizeMethod?: string | undefined;
  scopes: string[];
  locale: Locale;
  policy?: string | undefined;
  org?: string | undefined;
};

export type AuthCodeBody = {
  request: GetAuthorizeReqDto;
  user: IUser;
  otpCode: IOTP;
  appId: string;
  appName: string;
  isFullyAuthorized?: boolean;
};

export type EnrollOptions = {
  rpId: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  challenge: string;
};
