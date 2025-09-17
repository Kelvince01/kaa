"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { queryClient } from "@/query/query-client";
import type { User, UserRole, UserStatus } from "../users/user.type";
import { authService } from "./auth.service";
import { useAuthStore } from "./auth.store";
import type {
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from "./auth.type";

// Get role-based redirect path
export const getRoleRedirect = (role: string): string => {
  switch (role.toLowerCase()) {
    case "admin":
    case "super_admin":
      return "/admin";
    case "property_manager":
    case "manager":
    case "landlord":
    case "owner":
    case "maintenance":
      return "/dashboard";
    case "tenant":
      return "/account";
    default:
      return "/";
  }
};

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
  const { setUser, setTokens } = useAuthStore();
  // const { setTenant } = useSetTenant();
  // const tenant = useTenant();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      // Check if 2FA is required
      if ("requiresTwoFactor" in data && data.requiresTwoFactor) {
        toast.info("Please complete two-factor authentication");
        router.push(`/auth/two-factor?userId=${data.userId}`);
        return;
      }

      // Regular login success
      if ("user" in data && "tokens" in data) {
        setUser({
          id: data.user.id,
          memberId: data.user.memberId,
          username: data.user.username,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          avatar: data.user.avatar,
          role: data.user.role as UserRole,
          // roles: data.user.roles,
          // permissions: data.user.permissions,
          status: data.user.status as UserStatus,
          phone: data.user.phone,
          address: data.user.address,
          isActive: data.user.isActive,
          isVerified: data.user.isVerified,
          createdAt: data.user.createdAt,
          updatedAt: data.user.updatedAt,
        });
        setTokens(data.tokens);

        // if (data.user.role === "tenant") {
        // 	const tenant = await tenantService.getTenant(data.user.tenantId);

        // 	useSetTenant(data.user.tenant);
        // }

        toast.success("Login successful!");

        // Redirect based on user role
        const redirectPath = getRoleRedirect(data.user.role);
        router.push(redirectPath);
      }
    },
    onError: (error: any) => {
      const errorData = error.response?.data;

      if (errorData?.verified === false) {
        toast.error("Please verify your email before logging in");
        // router.push(`/auth/verify-email?email=${encodeURIComponent(values.email)}`);
        router.push("/auth/verify-email");
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
export const useResendVerification = () => {
  return useMutation({
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
};

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

// Get current user hook
export const useCurrentUser = () => {
  const { user, setUser, setLoading } = useAuthStore();

  const { data, error, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: authService.getCurrentUser,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) setLoading(true);

  if (data?.user) {
    setUser(data.user as User);
  }

  if ((error as any).response?.status === 401) {
    useAuthStore.getState().logout();
  }
};

// Logout hook
export const useLogout = () => {
  const router = useRouter();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      logout();
      queryClient.clear();
      toast.success("Logged out successfully");
      router.push("/auth/login");
    },
    onError: (_error: any) => {
      // Even if logout fails on server, clear local state
      logout();
      queryClient.clear();
      router.push("/auth/login");
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
export const useForgotPassword = () => {
  return useMutation({
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
};

// Reset password hook
export const useResetPassword = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: (data) => {
      toast.success(data.message || "Password reset successfully!");
      router.push("/auth/login");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Password reset failed";
      toast.error(message);
    },
  });
};

// Refresh token hook
export const useRefreshToken = () => {
  const { setTokens, setUser } = useAuthStore();

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

      // Fetch and update user data with new tokens
      try {
        const userData = await authService.getCurrentUser();
        if (userData?.user) {
          setUser(userData.user as User);
        }
      } catch (error) {
        console.error("Failed to fetch user after token refresh:", error);
        // If we can't get user with new tokens, clear auth state
        useAuthStore.getState().logout();
      }
    },
    onError: (error: any) => {
      console.error("Token refresh failed:", error);
      // On any error during refresh, clear auth state
      useAuthStore.getState().logout();
    },
  });
};

// Auth guard hook
export const useAuthGuard = (requiredRole?: string) => {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const checkAuth = () => {
    if (!(isAuthenticated && user)) {
      router.push("/auth/login");
      return false;
    }

    if (requiredRole && user.role !== requiredRole) {
      // Redirect to appropriate dashboard based on user role
      const redirectPath = getRoleRedirect(user.role as string);
      router.push(redirectPath);
      return false;
    }

    return true;
  };

  return { checkAuth, user, isAuthenticated };
};
