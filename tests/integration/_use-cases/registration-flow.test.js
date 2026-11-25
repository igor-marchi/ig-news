import { webserver } from "infra/webserver";
import { activation } from "models/activation";
import { user } from "models/user";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  describe("Create user account", () => {
    let responseBody;
    let activationTokenId;

    test("With unique and valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user-name",
          email: "username@mail.com",
          password: "password123",
        }),
      });

      expect(response.status).toBe(201);

      responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "user-name",
        email: "username@mail.com",
        password: responseBody.password,
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
    });

    test("Receive activation email", async () => {
      const lastEmail = await orchestrator.getLastEmail();

      expect(lastEmail.sender).toBe("<contato@ignews.com.br>");
      expect(lastEmail.recipients[0]).toBe("<username@mail.com>");
      expect(lastEmail.subject).toBe("Ative seu cadastro no Ignews!");
      expect(lastEmail.text).toContain("user-name");

      activationTokenId = orchestrator.extractUUID(lastEmail.text);
      expect(lastEmail.text).toContain(
        `${webserver.origin}/cadastro/ativar/${activationTokenId}`,
      );

      const activationTokenObject =
        await activation.findOneValidById(activationTokenId);
      expect(activationTokenObject.user_id).toBe(responseBody.id);
      expect(activationTokenObject.used_at).toBeNull();
    });

    test("Activate account", async () => {
      const activationResponse = await fetch(
        `http://localhost:3000/api/v1/activations/${activationTokenId}`,
        {
          method: "PATCH",
        },
      );

      expect(activationResponse.status).toBe(200);

      const activationResponseBody = await activationResponse.json();
      expect(Date.parse(activationResponseBody.used_at)).not.toBeNaN();

      const activatedUser = await user.findOneByUserName("user-name");
      expect(activatedUser.features).toEqual(["create:session"]);
    });

    test("Login", async () => {});

    test("Get user information", async () => {});
  });
});
