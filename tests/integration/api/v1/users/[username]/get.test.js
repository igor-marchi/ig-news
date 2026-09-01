import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With case match", async () => {
      const postResponse = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "userName",
          email: "username@mail.com",
          password: "password123",
        }),
      });

      expect(postResponse.status).toBe(201);

      const getResponse = await fetch(
        "http://localhost:3000/api/v1/users/userName",
      );

      expect(getResponse.status).toBe(200);

      const getBody = await getResponse.json();
      expect(getBody).toEqual({
        id: getBody.id,
        username: "username",
        email: "username@mail.com",
        password: "password123",
        created_at: getBody.created_at,
        updated_at: getBody.updated_at,
      });

      expect(uuidVersion(getBody.id)).toBe(4);
      expect(Date.parse(getBody.created_at)).not.toBeNaN();
      expect(Date.parse(getBody.updated_at)).not.toBeNaN();
    });

    test("With case mismatch", async () => {
      const postResponse = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "userName2",
          email: "username2@mail.com",
          password: "password123",
        }),
      });

      expect(postResponse.status).toBe(201);

      const getResponse = await fetch(
        "http://localhost:3000/api/v1/users/username2",
      );

      expect(getResponse.status).toBe(200);

      const getBody = await getResponse.json();
      expect(getBody).toEqual({
        id: getBody.id,
        username: "username2",
        email: "username2@mail.com",
        password: "password123",
        created_at: getBody.created_at,
        updated_at: getBody.updated_at,
      });

      expect(uuidVersion(getBody.id)).toBe(4);
      expect(Date.parse(getBody.created_at)).not.toBeNaN();
      expect(Date.parse(getBody.updated_at)).not.toBeNaN();
    });

    test("With non existente user", async () => {
      const getResponse = await fetch(
        "http://localhost:3000/api/v1/users/usernameeee",
      );

      expect(getResponse.status).toBe(404);

      const getResponseBody = await getResponse.json();
      expect(getResponseBody).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
        status_code: 404,
      });
    });
  });
});
