export interface RegisterRequest {
	username?: string;
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	phone: string;
	role?: "landlord" | "tenant";
}

export interface RegisterResponse {
	status: "success" | "error";
	data?: { message: string; userId: string; email: string };
	message?: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface LoginResponse {
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
}

export interface RegisterResponse {
	status: "success" | "error";
	data?: { message: string; userId: string };
	message?: string;
}

export interface VerifyEmailRequest {
	token: string;
}

export interface VerifyEmailResponse {
	status: "success" | "error";
	message: string;
	error?: any;
}

export interface ResendVerificationRequest {
	email: string;
}

export interface ResendVerificationResponse {
	status: "success" | "error";
	message: string;
	error?: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface LoginResponse_v2 {
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
}

export interface LoginTwoFactorResponse {
	status: "success";
	message: string;
	requiresTwoFactor: true;
	userId: string;
}

export interface VerifyEmailRequest {
	token: string;
}

export interface VerifyEmailResponse {
	status: "success" | "error";
	message: string;
	error?: any;
}

export interface ResendVerificationRequest {
	email: string;
}

export interface ResendVerificationResponse {
	status: "success" | "error";
	message: string;
	error?: string;
}

export interface ForgotPasswordRequest {
	email: string;
}

export interface ResetPasswordRequest {
	token: string;
	password: string;
}

export interface MeResponse {
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
}

export interface AvatarUploadResponse {
	status: "success" | "error";
	avatar?: string;
	message?: string;
}
