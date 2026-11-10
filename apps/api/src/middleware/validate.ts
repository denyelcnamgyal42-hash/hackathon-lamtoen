import { firstFieldErrors, type FieldErrorMap } from "@lamton/shared";
import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { HttpError } from "../lib/errors.js";

export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const fields: FieldErrorMap = firstFieldErrors(parsed.error);
      next(
        new HttpError(400, "VALIDATION_ERROR", "Some fields need attention.", {
          fields,
        }),
      );
      return;
    }
    req.body = parsed.data;
    next();
  };
}
