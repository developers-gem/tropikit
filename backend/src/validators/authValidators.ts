import { z } from "zod";

const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

export const registerSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: passwordSchema,
  name: z.string().trim().max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().max(100),
});

export const updatePreferencesSchema = z
  .object({
    defaultTimezone: z.string().max(100).nullable(),
    emailNotifications: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "At least one preference must be provided");

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: passwordSchema,
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required to confirm account deletion"),
});
