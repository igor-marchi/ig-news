import setCookieParser from "set-cookie-parser";
import { session } from "models/session";
import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("With incorrect `email` but correct `password`", async () => {
      await orchestrator.createUser({
        password: "correct-password",
      });

      const url = "http://localhost:3000/api/v1/sessions";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "incorrectEmail@mail.com",
          password: "incorrect-password",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        status_code: 401,
        name: "UnauthorizedError",
        message: "Dados de autenticação inválidos.",
        action: "Verifique se os dados enviados estão corretos.",
      });
    });

    test("With correct `email` but incorrect `password`", async () => {
      await orchestrator.createUser({
        email: "correctEmail@mail.com",
      });

      const url = "http://localhost:3000/api/v1/sessions";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "correctEmail@mail.com",
          password: "incorrect-password",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        status_code: 401,
        name: "UnauthorizedError",
        message: "Dados de autenticação inválidos.",
        action: "Verifique se os dados enviados estão corretos.",
      });
    });

    test("With incorrect `email` and incorrect `password`", async () => {
      await orchestrator.createUser({
        email: "correct-email@mail.com",
        password: "correct-password",
      });

      const url = "http://localhost:3000/api/v1/sessions";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "incorrectEmail@mail.com",
          password: "incorrect-password",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        status_code: 401,
        name: "UnauthorizedError",
        message: "Dados de autenticação inválidos.",
        action: "Verifique se os dados enviados estão corretos.",
      });
    });

    test("With correct `email` and correct `password`", async () => {
      const createdUser = await orchestrator.createUser({
        email: "all-correct-email@mail.com",
        password: "all-correct-password",
      });

      const url = "http://localhost:3000/api/v1/sessions";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "all-correct-email@mail.com",
          password: "all-correct-password",
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        token: responseBody.token,
        user_id: createdUser.id,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.created_at);
      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt - createdAt).toBe(session.EXPIRATION_IN_MILLISECONDS);

      const parsedSetCookieHeader = setCookieParser.parse(response);
      expect(parsedSetCookieHeader).toEqual([
        {
          name: "session_id",
          value: responseBody.token,
          httpOnly: true,
          maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
          path: "/",
        },
      ]);
    });
  });
});
