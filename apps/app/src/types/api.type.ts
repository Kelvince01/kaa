export type ApiResponse<T = any> = {
  status: "success" | "error";
  message?: string;
  data?: T;
  user?: T;
  tokens?: {
    access_token: string;
    refresh_token: string;
  };
};

export type ErrorResponse = {
  status: "error";
  message: string;
  verified?: boolean;
};
