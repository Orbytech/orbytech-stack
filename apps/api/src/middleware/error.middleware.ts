import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ApiResponse } from '../types';

export const errorHandler = async (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // Log the error
  request.log.error(error);

  // Handle validation errors
  if (error.validation) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        details: error.validation,
      },
      timestamp: new Date(),
    };

    return reply.status(400).send(response);
  }

  // Handle known error codes
  const statusCode = error.statusCode || 500;
  const errorCode = getErrorCode(error);
  const message = getErrorMessage(error);

  const response: ApiResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
    },
    timestamp: new Date(),
  };

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    response.error!.message = 'Internal server error';
  }

  return reply.status(statusCode).send(response);
};

function getErrorCode(error: FastifyError): string {
  if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
    return 'MISSING_AUTH_TOKEN';
  }
  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
    return 'EXPIRED_AUTH_TOKEN';
  }
  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
    return 'INVALID_AUTH_TOKEN';
  }
  if (error.statusCode === 404) {
    return 'NOT_FOUND';
  }
  if (error.statusCode === 401) {
    return 'UNAUTHORIZED';
  }
  if (error.statusCode === 403) {
    return 'FORBIDDEN';
  }
  if (error.statusCode === 429) {
    return 'RATE_LIMIT_EXCEEDED';
  }
  return 'INTERNAL_ERROR';
}

function getErrorMessage(error: FastifyError): string {
  if (error.message) {
    return error.message;
  }
  
  switch (error.statusCode) {
    case 400:
      return 'Bad request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Resource not found';
    case 429:
      return 'Too many requests';
    case 500:
      return 'Internal server error';
    default:
      return 'Unknown error';
  }
}
