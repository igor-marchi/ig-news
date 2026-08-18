import {
  InternalServerError,
  MethodNotAllowedError,
  ValidationError,
} from "infra/errors";

export function onNoMatchHandler(request, response) {
  const error = new MethodNotAllowedError();
  response.status(error.statusCode).json(error);
}

export function onErrorHandler(error, request, response) {
  if (error instanceof ValidationError) {
    return response.status(error.statusCode).json(error);
  }

  const internalServerError = new InternalServerError({
    statusCode: error.statusCode,
    cause: error,
  });

  console.log(internalServerError);

  response.status(internalServerError.statusCode).json(internalServerError);
}

export const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
};
