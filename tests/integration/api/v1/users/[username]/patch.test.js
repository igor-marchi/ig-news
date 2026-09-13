import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With non existente 'username'", async () => {
      const getResponse = await fetch(
        "http://localhost:3000/api/v1/users/usernameeee",
        {
          headers: {
            "Content-Type": "application/json",
          },
          method: "PATCH",
        },
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

    test("With  duplicated 'username'", async () => {
      const url = "http://localhost:3000/api/v1/users";
      const user1 = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user1",
          email: "user1@mail.com",
          password: "password123",
        }),
      });

      expect(user1.status).toBe(201);

      const user2 = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user2",
          email: "user2@mail.com",
          password: "password123",
        }),
      });

      expect(user2.status).toBe(201);

      const patchResponse = await fetch(
        "http://localhost:3000/api/v1/users/user1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "user2",
          }),
        },
      );

      expect(patchResponse.status).toBe(400);

      const patchResponseBody = await patchResponse.json();

      expect(patchResponseBody).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado",
        action: "Utilize outro username para realizar esta operação",
        status_code: 400,
      });
    });

    test("With  duplicated 'email'", async () => {
      const url = "http://localhost:3000/api/v1/users";
      const email1 = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "email1",
          email: "email1@mail.com",
          password: "password123",
        }),
      });

      expect(email1.status).toBe(201);

      const email2 = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "email2",
          email: "email2@mail.com",
          password: "password123",
        }),
      });

      expect(email2.status).toBe(201);

      const patchResponse = await fetch(
        "http://localhost:3000/api/v1/users/email1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "email2@mail.com",
          }),
        },
      );

      expect(patchResponse.status).toBe(400);

      const patchResponseBody = await patchResponse.json();

      expect(patchResponseBody).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado",
        action: "Utilize outro email para realizar esta operação",
        status_code: 400,
      });
    });
  });
});
