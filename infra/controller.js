import * as cookie from "cookie";
import { session } from "models/session";
import {
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "infra/errors";

function onNoMatchHandler(request, response) {
  const error = new MethodNotAllowedError();
  response.status(error.statusCode).json(error);
}

function onErrorHandler(error, request, response) {
  if (isCustomError(error)) {
    if (error instanceof UnauthorizedError) {
      controller.clearSessionCookie(response);
    }

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

function setSessionCookie(response, sessionToken) {
  const setCookieHeader = cookie.serialize("session_id", sessionToken, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000, // Convert milliseconds to seconds
  });
  response.setHeader("Set-Cookie", setCookieHeader);
}

function clearSessionCookie(response) {
  const setCookieHeader = cookie.serialize("session_id", "invalid", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: -1,
  });
  response.setHeader("Set-Cookie", setCookieHeader);
}

export const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  setSessionCookie,
  clearSessionCookie,
};
