import * as cookie from "cookie";
import { session } from "models/session";
import {
  ForbiddenError,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "infra/errors";
import { user } from "models/user";
import { authorization } from "models/authorization";

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
      error instanceof UnauthorizedError ||
      error instanceof ForbiddenError
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

async function injectAnonymousOrUser(request, response, next) {
  if (request.cookies?.session_id) {
    await injectAuthenticatedUser(request);
  } else {
    await injectAnonymousUser(request);
  }

  return next();
}

async function injectAuthenticatedUser(request) {
  const sessionToken = request.cookies.session_id;
  const sessionObject = await session.findOneValidByToken(sessionToken);
  const userObject = await user.findOneById(sessionObject.user_id);

  request.context = {
    ...request.context,
    user: userObject,
  };
}

async function injectAnonymousUser(request) {
  const anonymousUserObject = {
    features: ["read:activation_token", "create:session", "create:user"],
  };

  request.context = {
    ...request.context,
    user: anonymousUserObject,
  };
}

function canRequest(feature) {
  return function canRequestMiddleware(request, response, next) {
    const userTryingToRequest = request.context.user;

    if (!authorization.can(userTryingToRequest, feature)) {
      throw new ForbiddenError({
        message: "Você não possui permissão para executar essa ação.",
        action: `Verifique se o seu usuário possui a feature "${feature}"`,
      });
    }

    return next();
  };
}

export const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  setSessionCookie,
  clearSessionCookie,
  injectAnonymousOrUser,
  canRequest,
};
