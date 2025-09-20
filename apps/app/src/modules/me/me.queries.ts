import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../auth/auth.store";
import type { User } from "../users/user.type";
import { meService } from "./me.service";

// Get current user hook
export const useCurrentUser = () => {
  const { user, setUser, setLoading } = useAuthStore();

  const { data, error, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: meService.getCurrentUser,
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
