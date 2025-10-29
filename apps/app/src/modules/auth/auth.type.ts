export type RegisterRequest = {
  username?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: "landlord" | "tenant";
};

export type RegisterResponse = {
  status: "success" | "error";
  data?: { message: string; userId: string; email: string };
  message?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  status: "success";
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string;
    memberId: string;
    role: string;
    phone: string;
    address: {
      line1: string;
      town: string;
      postalCode: string;
      county: string;
      country: string;
    };
    status: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  tokens: {
    access_token: string;
    refresh_token: string;
  };
};

export type LoginResponse_v2 = {
  status: "success" | "error";
  user?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    memberId: string;
    role: string;
  };
  tokens?: {
    access_token: string;
    refresh_token: string;
  };
  message?: string;
  verified?: boolean;
  requiresTwoFactor?: boolean;
  userId?: string;
};

export type LoginTwoFactorResponse = {
  status: "success";
  message: string;
  requiresTwoFactor: true;
  userId: string;
};

export type VerifyEmailRequest = {
  token: string;
};

export type VerifyEmailResponse = {
  status: "success" | "error";
  message: string;
  error?: any;
};

export type ResendVerificationRequest = {
  email: string;
};

export type ResendVerificationResponse = {
  status: "success" | "error";
  message: string;
  error?: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  password: string;
};

export type MeResponse_v1 = {
  status: "success" | "error";
  user?: {
    id: string;
    memberId: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  message?: string;
  error?: string;
};

export type AvatarUploadResponse = {
  status: "success" | "error";
  avatar?: string;
  message?: string;
};
