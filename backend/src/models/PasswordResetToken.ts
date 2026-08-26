import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Same "never store the real secret" pattern as RefreshToken — only the hash is stored, the
 * raw token exists only transiently (returned to the requester once, meant to be emailed in
 * a real deployment — see authService.requestPasswordReset for the honest limitation here:
 * this project has no email-sending infrastructure).
 */
const PasswordResetTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type PasswordResetTokenDoc = InferSchemaType<typeof PasswordResetTokenSchema>;
export const PasswordResetToken = model("PasswordResetToken", PasswordResetTokenSchema);
