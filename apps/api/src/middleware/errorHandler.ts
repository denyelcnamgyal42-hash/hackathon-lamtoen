import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { HttpError } from "../lib/errors.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
    return;
  }

  if (isInvalidJson(error)) {
    res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "The request body is not valid JSON.",
      },
    });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "The submitted values were not accepted.",
      },
    });
    return;
  }

  if (isDatabaseUnavailable(error)) {
    res.status(503).json({
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "The database is unavailable. Try again once the connection is restored.",
      },
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong while handling the request.",
    },
  });
};

function isInvalidJson(error: unknown): boolean {
  return (
    error instanceof SyntaxError &&
    "status" in error &&
    (error as { status?: number }).status === 400 &&
    "body" in error
  );
}

function isDatabaseUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "MongoNotConnectedError" ||
    error.name === "MongoServerSelectionError" ||
    error.name === "MongoNetworkError"
  );
}
