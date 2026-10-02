import { user } from "models/user";
import { password } from "models/password";
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
      await orchestrator.createUser({
        username: "user1",
      });

      await orchestrator.createUser({
        username: "user2",
      });

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
      const createdUser1 = await orchestrator.createUser({
        email: "email1@mail.com",
      });

      await orchestrator.createUser({
        email: "email2@mail.com",
      });

      const patchResponse = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser1.username}`,
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

    test("With  unique 'username'", async () => {
      const firstUserName = "uniqueUser1";
      const secondUserName = "uniqueUser2";

      const createdUser = await orchestrator.createUser({
        username: firstUserName,
      });

      const patchResponse = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: secondUserName,
          }),
        },
      );

      expect(patchResponse.status).toBe(200);

      const patchResponseBody = await patchResponse.json();

      expect(patchResponseBody).toEqual({
        id: createdUser.id,
        username: secondUserName,
        email: createdUser.email,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: patchResponseBody.updated_at,
      });

      expect(uuidVersion(patchResponseBody.id)).toBe(4);
      expect(Date.parse(patchResponseBody.created_at)).not.toBeNaN();
      expect(Date.parse(patchResponseBody.updated_at)).not.toBeNaN();

      expect(patchResponseBody.updated_at > patchResponseBody.created_at).toBe(
        true,
      );
    });

    test("With  unique 'email'", async () => {
      const firstEmail = "uniqueEmail1@mail.com";
      const secondEmail = "uniqueEmail2@mail.com";

      const createdUser = await orchestrator.createUser({
        email: firstEmail,
      });

      const patchResponse = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: secondEmail,
          }),
        },
      );

      expect(patchResponse.status).toBe(200);

      const patchResponseBody = await patchResponse.json();

      expect(patchResponseBody).toEqual({
        id: createdUser.id,
        username: createdUser.username,
        email: secondEmail,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: patchResponseBody.updated_at,
      });

      expect(Date.parse(patchResponseBody.updated_at)).not.toBeNaN();

      expect(patchResponseBody.updated_at > patchResponseBody.created_at).toBe(
        true,
      );
    });

    test("With  new 'password'", async () => {
      const firstPassword = "newPassword1";
      const secondPassword = "newPassword2";

      const createdUser = await orchestrator.createUser({
        password: firstPassword,
      });

      const patchResponse = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: secondPassword,
          }),
        },
      );

      expect(patchResponse.status).toBe(200);

      const patchResponseBody = await patchResponse.json();

      expect(patchResponseBody).toEqual({
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        password: patchResponseBody.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: patchResponseBody.updated_at,
      });

      expect(uuidVersion(patchResponseBody.id)).toBe(4);
      expect(Date.parse(patchResponseBody.updated_at)).not.toBeNaN();

      expect(patchResponseBody.updated_at > patchResponseBody.created_at).toBe(
        true,
      );

      const userInDatabase = await user.findOneByUserName(createdUser.username);

      const correctPassword = await password.compare(
        secondPassword,
        userInDatabase.password,
      );
      expect(correctPassword).toBe(true);

      const incorrectPassword = await password.compare(
        firstPassword,
        userInDatabase.password,
      );
      expect(incorrectPassword).toBe(false);
    });
  });
});
