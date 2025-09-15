import { httpClient } from "@/lib/axios";
import type {
  User,
  UserCreateInput,
  UserFilter,
  UserUpdateInput,
} from "./user.type";

// API response types based on the control
export async function getUsers(filter: UserFilter): Promise<{
  users: User[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const { data } = await httpClient.api.get<{
    users: User[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>("/users", { params: filter });
  return data;
}

// Get a single user by ID
export async function getUserById(id: string): Promise<User> {
  const { data } = await httpClient.api.get<User>(`/users/${id}`);
  return data;
}

// Create a new user
export async function createUser(input: UserCreateInput): Promise<User> {
  const { data } = await httpClient.api.post<User>("/users", input);
  return data;
}

// Update an existing user
export async function updateUser(
  id: string,
  input: UserUpdateInput
): Promise<User> {
  const { data } = await httpClient.api.patch<User>(`/users/${id}`, input);
  return data;
}

// Delete a user
export async function deleteUser(id: string): Promise<void> {
  await httpClient.api.delete(`/users/${id}`);
}

// Update user status (active/inactive)
export async function updateUserStatus(
  id: string,
  isActive: boolean
): Promise<User> {
  const { data } = await httpClient.api.patch<User>(`/users/${id}/status`, {
    isActive,
  });
  return data;
}

// Get current user's profile
export async function getCurrentUser(): Promise<User> {
  const { data } = await httpClient.api.get<User>("/users/me");
  return data;
}

// Update current user's profile
export async function updateCurrentUser(
  input: Partial<UserUpdateInput>
): Promise<User> {
  const { data } = await httpClient.api.patch<User>("/users/me", input);
  return data;
}

// Change password
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> {
  const response = await httpClient.api.post<{
    status: "success" | "error";
    message: string;
  }>("/users/password/change", data);
  if (response.data.status === "error") {
    throw new Error(response.data.message || "Failed to change password");
  }
  return { message: response.data.message };
}
