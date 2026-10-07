import { createRouter } from "next-connect";
import * as cookie from "cookie";
import { controller } from "infra/controller";
import { authentication } from "models/authentication";
import { session } from "models/session";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userInputValues = request.body;

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );

  const newSession = await session.create(authenticatedUser.id);

  const setCookieHeader = cookie.serialize("session_id", newSession.token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000, // Convert milliseconds to seconds
  });
  response.setHeader("Set-Cookie", setCookieHeader);

  return response.status(201).json(newSession);
}
