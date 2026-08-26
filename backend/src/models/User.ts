import { Schema, model, type InferSchemaType } from "mongoose";
import bcrypt from "bcryptjs";

const PreferencesSchema = new Schema(
  {
    defaultTimezone: { type: String, default: null },
    emailNotifications: { type: Boolean, default: true },
  },
  { _id: false },
);

const USER_ROLES = ["user", "admin", "content-editor", "reviewer"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export { USER_ROLES };

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true, default: "" },
    // Defaults to "user" — every account is a normal user unless explicitly promoted.
    // Promotion itself happens only via direct database access in this phase (no
    // self-service "become admin" endpoint exists, deliberately).
    role: { type: String, enum: USER_ROLES, default: "user", index: true },
    preferences: { type: PreferencesSchema, default: () => ({}) },
    // Bumped whenever the password changes (change-password or reset-password). Not used for
    // token invalidation directly (refresh tokens are revoked explicitly on password change —
    // see authService.ts) but kept as an honest audit trail of when it last changed.
    passwordChangedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

UserSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export type UserDoc = InferSchemaType<typeof UserSchema> & {
  _id: unknown;
  comparePassword(candidate: string): Promise<boolean>;
};

export const User = model("User", UserSchema);
