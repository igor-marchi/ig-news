import setCookieParser from "set-cookie-parser";
import { session } from "models/session";
import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  describe("Default user", () => {
    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "userWithValidSession",
      });

      const sessionObject = await orchestrator.createSession(createdUser.id);

      const getResponse = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      const getBody = await getResponse.json();
      expect(getBody).toEqual({
        id: createdUser.id,
        username: "userWithValidSession",
        email: createdUser.email,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      expect(uuidVersion(getBody.id)).toBe(4);
      expect(Date.parse(getBody.created_at)).not.toBeNaN();
      expect(Date.parse(getBody.updated_at)).not.toBeNaN();

      // Check if the session was renewed

      const renewedSessionObject = await session.findOneValidByToken(
        sessionObject.token,
      );

      expect(renewedSessionObject.expires_at > sessionObject.expires_at).toBe(
        true,
      );
      expect(renewedSessionObject.updated_at > sessionObject.updated_at).toBe(
        true,
      );

      // Check if Set-Cookie header is present in the response

      const parsedSetCookieHeader = setCookieParser.parse(getResponse);
      expect(parsedSetCookieHeader).toEqual([
        {
          name: "session_id",
          value: sessionObject.token,
          httpOnly: true,
          maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
          path: "/",
        },
      ]);
    });

    test("With nonexistent session", async () => {
      const nonExistentSessionToken =
        "548f83e05e5fe1111932b26c17d59ff701ae63686d81b0f7a589855393152f0224f386fbe06ad4edc61f76af4d583909";

      const getResponse = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${nonExistentSessionToken}`,
        },
      });

      expect(getResponse.status).toBe(401);

      const getBody = await getResponse.json();

      expect(getBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });
    });

    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser({
        username: "userWithExpiredSession",
      });

      const sessionObject = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const getResponse = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(getResponse.status).toBe(401);

      const getBody = await getResponse.json();
      expect(getBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });
    });

    test("Whit one minute before session expiration", async () => {
      jest.useFakeTimers({
        now: new Date(
          Date.now() - session.EXPIRATION_IN_MILLISECONDS + 60 * 1000, // 1 minute before expiration
        ),
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithAlmostExpiredSession",
      });

      const sessionObject = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UserWithAlmostExpiredSession",
        email: createdUser.email,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      // Session renewal assertions
      const renewedSessionObject = await session.findOneValidByToken(
        sessionObject.token,
      );

      expect(
        renewedSessionObject.expires_at > sessionObject.expires_at,
      ).toEqual(true);
      expect(
        renewedSessionObject.updated_at > sessionObject.updated_at,
      ).toEqual(true);

      // Set-Cookie assertions
      const parsedSetCookieHeader = setCookieParser.parse(response);
      expect(parsedSetCookieHeader).toEqual([
        {
          name: "session_id",
          value: sessionObject.token,
          httpOnly: true,
          maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
          path: "/",
        },
      ]);
    });
  });
});
