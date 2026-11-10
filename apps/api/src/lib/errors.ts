import type { FieldErrorMap } from "@lamton/shared";

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: { fields?: FieldErrorMap };

  constructor(
    status: number,
    code: string,
    message: string,
    details?: { fields?: FieldErrorMap },
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
