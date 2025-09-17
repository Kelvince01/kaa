import type React from "react";
import { useCurrentUser } from "../auth.queries";
import { useAuth } from "../use-auth";

function AuthLoader({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  useCurrentUser();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}

export default AuthLoader;
