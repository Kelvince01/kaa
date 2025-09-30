import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { queryClient } from "@/query/query-client";
import { useLogout } from "../auth/auth.queries";
import * as userService from "./user.service";
import type { UserCreateInput, UserFilter, UserUpdateInput } from "./user.type";

// Query keys
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: UserFilter) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Hooks for user data fetching
export const useUsers = (filters: UserFilter) =>
  useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => userService.getUsers(filters),
  });

export const useUser = (id: string) =>
  useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getUserById(id),
    enabled: !!id,
  });

// Mutation hooks
export const useCreateUser = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: UserCreateInput) => userService.createUser(data),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success(`User ${user.email} has been created successfully.`);
      router.push("/users");
    },
    onError: (error: Error) => {
      toast.error(`Error creating user: ${error.message}`);
    },
  });
};

export const useUpdateUser = () =>
  useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdateInput }) =>
      userService.updateUser(id, data),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(user.id) });
      toast.success(`User ${user.email} has been updated successfully.`);
    },
    onError: (error: Error) => {
      toast.error(`Error updating user: ${error.message}`);
    },
  });

export const useDeleteUser = () =>
  useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.removeQueries({ queryKey: userKeys.detail(id) });
      toast.success(`User ${id} has been deleted successfully.`);
    },
    onError: (error: Error) => {
      toast.error(`Error deleting user: ${error.message}`);
    },
  });

export const useChangePassword = () => {
  const { mutateAsync: logout } = useLogout();

  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      userService.changePassword(data),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      logout();
    },
    onError: (error: Error) => {
      toast.error(`Error changing password: ${error.message}`);
    },
  });
};
