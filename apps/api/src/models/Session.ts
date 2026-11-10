import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    csrfToken: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type SessionDocument = InferSchemaType<typeof sessionSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
};

export const Session = model<SessionDocument>("Session", sessionSchema);

export const SESSION_COOKIE = "lamton.sid";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
