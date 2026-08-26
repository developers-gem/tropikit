import { apiRequest } from "./client";
import type { User } from "@/types/api";

interface AuthResult {
  accessToken: string;
  user: User;
}

export function registerRequest(input: { email: string; password: string; name?: string }) {
  return apiRequest<AuthResult>("/auth/register", { method: "POST", body: input });
}

export function loginRequest(input: { email: string; password: string }) {
  return apiRequest<AuthResult>("/auth/login", { method: "POST", body: input });
}

export function logoutRequest() {
  return apiRequest<null>("/auth/logout", { method: "POST", auth: true });
}

export function fetchCurrentUser() {
  return apiRequest<User>("/auth/me", { auth: true });
}

export function updateProfileRequest(input: { name: string }) {
  return apiRequest<User>("/auth/profile", { method: "PUT", body: input, auth: true });
}

export function updatePreferencesRequest(input: {
  defaultTimezone?: string | null;
  emailNotifications?: boolean;
}) {
  return apiRequest<User>("/auth/preferences", { method: "PUT", body: input, auth: true });
}

export function changePasswordRequest(input: { currentPassword: string; newPassword: string }) {
  return apiRequest<null>("/auth/password", { method: "PUT", body: input, auth: true });
}

export function forgotPasswordRequest(input: { email: string }) {
  return apiRequest<{ resetToken?: string }>("/auth/forgot-password", {
    method: "POST",
    body: input,
  });
}

export function resetPasswordRequest(input: { token: string; newPassword: string }) {
  return apiRequest<null>("/auth/reset-password", { method: "POST", body: input });
}

export function deleteAccountRequest(input: { password: string }) {
  return apiRequest<null>("/auth/account", { method: "DELETE", body: input, auth: true });
}
