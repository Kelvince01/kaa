"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { queryClient } from "@/query/query-client";
import type { UserRole, UserStatus } from "../users/user.type";
import { authService } from "./auth.service";
import { useAuthStore } from "./auth.store";
import type {
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from "./auth.type";

export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
  login: (data: LoginRequest) => [...authKeys.all, "login", data] as const,
  register: (data: RegisterRequest) =>
    [...authKeys.all, "register", data] as const,
  verifyEmail: (token: string) => [...authKeys.all, "verify", token] as const,
  resendVerification: (email: string) =>
    [...authKeys.all, "resend", email] as const,
  forgotPassword: (email: string) =>
    [...authKeys.all, "forgot", email] as const,
  resetPassword: (data: ResetPasswordRequest) =>
    [...authKeys.all, "reset", data] as const,
  uploadAvatar: () => [...authKeys.all, "avatar"] as const,
} as const;

// Get role-based redirect path
export const getRoleRedirect = (role: string): string => {
  const redirects: Record<string, string> = {
    admin: "/admin",
    super_admin: "/admin",
    property_manager: "/dashboard",
    manager: "/dashboard",
    landlord: "/dashboard",
    owner: "/dashboard",
    maintenance: "/dashboard",
    tenant: "/account",
  };

  return redirects[role.toLowerCase()] || "/dashboard";
};

// Register hook
export const useRegister = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      toast.success(
        data.message ||
          "Registration successful! Please check your email to verify your account."
      );
      router.push(
        `/auth/verify-email?email=${encodeURIComponent(data.data?.email as string)}`
      );
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
    },
  });
};

// Login hook
export const useLogin = () => {
  const router = useRouter();
  const {
    setUser,
    setTokens,
    setStatus,
    getReturnUrl,
    clearReturnUrl,
    getSafeRedirectPath,
    resetRedirectAttempts,
    trackLoginAttempt,
  } = useAuthStore();

  // const { setTenant } = useSetTenant();
  // const tenant = useTenant();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data, variables) => {
      console.log("🔐 Login mutation success:", {
        hasUser: "user" in data,
        hasTokens: "tokens" in data,
        requiresTwoFactor:
          "requiresTwoFactor" in data && data.requiresTwoFactor,
        userId: (data as any)?.user?.id,
        userRole: (data as any)?.user?.role,
      });

      // Check if 2FA is required
      if ("requiresTwoFactor" in data && data.requiresTwoFactor) {
        console.log("🔐 2FA required, redirecting to two-factor page");
        toast.info("Please complete two-factor authentication");
        router.push(`/auth/two-factor?userId=${data.userId}`);
        return;
      }

      // Regular login success
      if ("user" in data && "tokens" in data) {
        console.log("🔐 Processing regular login success");
        // Track successful login
        trackLoginAttempt(variables.email, true);

        // Update user and tokens
        const userData = {
          id: data.user.id,
          memberId: data.user.memberId,
          username: data.user.username,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          avatar: data.user.avatar,
          role: data.user.role as UserRole,
          status: data.user.status as UserStatus,
          phone: data.user.phone,
          address: data.user.address,
          isActive: data.user.isActive,
          isVerified: data.user.isVerified,
          createdAt: data.user.createdAt,
          updatedAt: data.user.updatedAt,
        };

        console.log("🔐 Setting user data:", {
          userId: userData.id,
          role: userData.role,
        });
        setUser(userData);

        console.log("🔐 Setting tokens:", {
          hasAccessToken: !!data.tokens.access_token,
          hasRefreshToken: !!data.tokens.refresh_token,
        });
        setTokens(data.tokens);

        console.log("🔐 Setting status to authenticated");
        setStatus("authenticated");

        toast.success("Login successful!");

        // Reset redirect attempts on successful login
        resetRedirectAttempts();

        // Get and validate return URL
        const returnUrl = getReturnUrl();
        let redirectPath: string;

        if (returnUrl) {
          // Use the safe redirect path (validates the URL)
          redirectPath = getSafeRedirectPath(returnUrl);
          clearReturnUrl();
          console.log("🔐 Using return URL:", redirectPath);
        } else {
          // No return URL, use role-based default
          const userRole =
            typeof data.user.role === "string"
              ? data.user.role
              : ((data.user.role as any)._id as string);
          redirectPath = getRoleRedirect(userRole);
          console.log("🔐 Using role-based redirect:", {
            userRole,
            redirectPath,
          });
        }

        console.log("Login Query: Redirecting to", redirectPath);

        // Small delay to ensure state persistence before redirect
        setTimeout(() => {
          console.log("Login Query: Executing redirect now");
          router.replace(redirectPath);
        }, 100);
      }
    },
    onError: (error: any, variables) => {
      const errorData = error.response?.data;

      // Track failed login
      trackLoginAttempt(variables.email, false);

      if (errorData?.verified === false) {
        toast.error("Please verify your email before logging in");
        router.push(
          `/auth/verify-email?email=${encodeURIComponent(variables.email)}`
        );
        return;
      }

      const message = errorData?.message || "Login failed";
      toast.error(message);
    },
  });
};

// Verify email hook
export const useVerifyEmail = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.verifyEmail,
    onSuccess: (data) => {
      toast.success(data.message || "Email verified successfully!");
      router.push("/auth/login?verified=true");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Email verification failed";
      toast.error(message);
    },
  });
};

// Resend verification email hook
export const useResendVerification = () =>
  useMutation({
    mutationFn: authService.resendVerification,
    onSuccess: (data) => {
      toast.success(data.message || "Verification email sent!");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to send verification email";
      toast.error(message);
    },
  });

// Verify phone hook
export const useVerifyPhone = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.verifyPhone,
    onSuccess: (data) => {
      toast.success(data.message || "Phone verified successfully!");
      router.push("/auth/login");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Phone verification failed";
      toast.error(message);
    },
  });
};

// Logout hook
export const useLogout = () => {
  const router = useRouter();
  const { logout, clearReturnUrl, resetRedirectAttempts } = useAuthStore();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      logout();
      clearReturnUrl();
      resetRedirectAttempts();
      queryClient.clear();
      toast.success("Logged out successfully");
      router.replace("/auth/login");
    },
    onError: (_error: any) => {
      // Even if logout fails on server, clear local state
      logout();
      clearReturnUrl();
      resetRedirectAttempts();
      queryClient.clear();
      router.replace("/auth/login");
    },
  });
};

// Upload avatar hook
export const useUploadAvatar = () => {
  const { updateAvatar } = useAuthStore();

  return useMutation({
    mutationFn: authService.uploadAvatar,
    onSuccess: (data) => {
      updateAvatar(data.avatar);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Avatar updated successfully!");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to upload avatar";
      toast.error(message);
    },
  });
};

// Forgot password hook
export const useForgotPassword = () =>
  useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: (data) => {
      toast.success(data.message || "Password reset email sent!");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to send password reset email";
      toast.error(message);
    },
  });

// Reset password hook
export const useResetPassword = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: (data) => {
      toast.success(data.message || "Password reset successfully!");
      router.push("/auth/login?resetSuccess=true");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Password reset failed";
      toast.error(message);
    },
  });
};

// Refresh token hook
export const useRefreshToken = () => {
  const { setTokens, setUser, setStatus, logout } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      try {
        const tokens = await authService.refreshToken();
        return tokens;
      } catch (error) {
        console.error("Token refresh failed:", error);
        throw error;
      }
    },
    onSuccess: async (tokens) => {
      // Update tokens in store
      setTokens(tokens.tokens);
      setStatus("authenticated");

      // Try to fetch and update user data with new tokens
      // But don't logout if this fails - the user might still be valid
      try {
        const { meService } = await import("../me/me.service");
        const userData = await meService.fetchUserContext();
        if (userData?.user) {
          setUser(userData.user as any);
        } else {
          console.warn(
            "Failed to fetch user data after token refresh - user data may be stale"
          );
          // Don't logout here - the tokens are valid, just user data fetch failed
        }
      } catch (error) {
        console.warn(
          "Failed to fetch user after token refresh - keeping user logged in with refreshed tokens:",
          error
        );
        // Don't logout - the tokens are valid, just the user fetch failed
        // This prevents the logout loop issue
      }
    },
    onError: (error: any) => {
      console.error("Token refresh failed:", error);
      logout();
    },
  });
};

// Auth guard hook
export const useAuthGuard = (requiredRole?: string | string[]) => {
  const { user, isAuthenticated, getSafeRedirectPath } = useAuthStore();
  const router = useRouter();

  const checkAuth = () => {
    if (!(isAuthenticated && user)) {
      router.push("/auth/login");
      return false;
    }

    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      const userRole =
        typeof user.role === "string" ? user.role : user.role._id;

      if (!roles.includes(userRole)) {
        // Redirect to appropriate dashboard based on user role
        const redirectPath = getRoleRedirect(userRole);
        router.push(redirectPath);
        return false;
      }
    }

    return true;
  };

  return { checkAuth, user, isAuthenticated };
};
