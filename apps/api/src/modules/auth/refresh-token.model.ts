import mongoose, { Schema } from 'mongoose';

export interface RefreshToken {
  jti: string;
  userId: mongoose.Types.ObjectId;
  /** Null for PLATFORM_ADMIN sessions. */
  organizationId?: mongoose.Types.ObjectId | null;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<RefreshToken>(
  {
    jti: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, required: false, default: null },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'refresh_tokens' },
);

export const RefreshTokenModel =
  mongoose.models.RefreshToken ?? mongoose.model<RefreshToken>('RefreshToken', refreshTokenSchema);
