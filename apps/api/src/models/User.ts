import type { AccountState, PublicUser, Role } from "@lamton/shared";
import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    accountState: {
      type: String,
      required: true,
      enum: ["active", "suspended"],
      default: "active",
    },
    role: {
      type: String,
      required: true,
      enum: ["founder", "mentor", "admin"],
    },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const User = model<UserDocument>("User", userSchema);

export function toPublicUser(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: string;
  accountState: string;
  createdAt: Date;
}): PublicUser {
  if (!isRole(user.role) || !isAccountState(user.accountState)) {
    throw new Error("Stored account has an invalid role or state.");
  }
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    accountState: user.accountState,
    createdAt: user.createdAt.toISOString(),
  };
}

function isRole(value: string): value is Role {
  return value === "founder" || value === "mentor" || value === "admin";
}

function isAccountState(value: string): value is AccountState {
  return value === "active" || value === "suspended";
}
