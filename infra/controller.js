import {
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "infra/errors";

export function onNoMatchHandler(request, response) {
  const error = new MethodNotAllowedError();
  response.status(error.statusCode).json(error);
}

export function onErrorHandler(error, request, response) {
  if (isCustomError(error)) {
    return response.status(error.statusCode).json(error);
  }

  const internalServerError = new InternalServerError({
    cause: error,
  });

  console.log(internalServerError);

  response.status(internalServerError.statusCode).json(internalServerError);

  function isCustomError(error) {
    return (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof UnauthorizedError
    );
  }
}

export const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
};
