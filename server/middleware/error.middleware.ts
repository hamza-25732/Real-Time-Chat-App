import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Error as MongooseError } from 'mongoose';

import { config } from '../config/env.js';

/** Error carrying an explicit HTTP status, thrown by route and service code. */
export class HttpError extends Error {
  public readonly statusCode: number;

  public constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

/** Terminal handler for requests that matched no route. */
export const notFoundHandler: RequestHandler = (request, response): void => {
  response.status(404).json({
    error: 'Not Found',
    message: `Cannot ${request.method} ${request.originalUrl}`,
  });
};

/** Reason phrases for the statuses this API actually returns. */
const STATUS_TEXT: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
};

/**
 * Reads a status carried by the error itself. Express's body parser tags a
 * malformed JSON body with `status: 400`; without this it would surface as a
 * 500 and leak the parser's internal message.
 */
const readErrorStatus = (error: unknown): number | null => {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const { status, statusCode } = error as { status?: unknown; statusCode?: unknown };
  const candidate = typeof status === 'number' ? status : statusCode;

  return typeof candidate === 'number' && candidate >= 400 && candidate <= 599 ? candidate : null;
};

/** True for a request body Express could not parse as JSON. */
const isBodyParseError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'type' in error &&
  (error as { type: unknown }).type === 'entity.parse.failed';

/** MongoDB's unique-index violation, e.g. two registrations racing on an email. */
const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code: unknown }).code === 11000;

const resolveStatusCode = (error: unknown): number => {
  if (error instanceof HttpError) {
    return error.statusCode;
  }

  if (error instanceof MongooseError.ValidationError || error instanceof MongooseError.CastError) {
    return 400;
  }

  if (isDuplicateKeyError(error)) {
    return 409;
  }

  return readErrorStatus(error) ?? 500;
};

const resolveMessage = (error: unknown, statusCode: number): string => {
  if (statusCode >= 500 && config.isProduction) {
    return 'Internal server error';
  }

  if (isDuplicateKeyError(error) && !(error instanceof HttpError)) {
    return 'That email or username is already taken';
  }

  if (isBodyParseError(error)) {
    return 'Request body must be valid JSON';
  }

  return error instanceof Error ? error.message : 'Unknown error';
};

/**
 * Central error middleware. Every failed request leaves through here, so error
 * shape stays consistent and nothing is silently swallowed.
 */
export const errorHandler: ErrorRequestHandler = (error, _request, response, _next): void => {
  const statusCode = resolveStatusCode(error);

  if (statusCode >= 500) {
    console.error('[http] unhandled error:', error);
  }

  response.status(statusCode).json({
    error: STATUS_TEXT[statusCode] ?? 'Internal Server Error',
    message: resolveMessage(error, statusCode),
  });
};
