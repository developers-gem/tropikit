import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Refresh tokens are opaque random strings, never JWTs — the raw value is returned to the
 * client exactly once (as an httpOnly cookie) and only its SHA-256 hash is ever stored here,
 * the same "never store the real secret" principle as password hashing.
 *
 * Rotation: every successful refresh revokes the presented token and issues a new one,
 * linked via `replacedByTokenHash`. If a token that's already revoked is ever presented again,
 * that's a strong signal of theft (someone replayed a stolen token after it was already
 * rotated) — see authService.refreshAccessToken, which responds to that by revoking every
 * token for the user, not just the one presented.
 */
const RefreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByTokenHash: { type: String, default: null },
  },
  { timestamps: true },
);

export type RefreshTokenDoc = InferSchemaType<typeof RefreshTokenSchema>;
export const RefreshToken = model("RefreshToken", RefreshTokenSchema);
