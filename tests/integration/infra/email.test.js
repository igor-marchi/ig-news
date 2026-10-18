import email from "infra/email";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email", () => {
  test("send", async () => {
    await orchestrator.deleteAllEmails();
    await email.send({
      from: "IgNews <contato@ignews.com.br>",
      to: "<contato@ignews.com.br>",
      subject: "Teste de assunto",
      text: "Teste de corpo",
    });

    await email.send({
      from: "IgNews <contato@ignews.com.br>",
      to: "<contato@ignews.com.br>",
      subject: "Último email enviado",
      text: "Corpo do último email enviado",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toBe("<contato@ignews.com.br>");
    expect(lastEmail.recipients[0]).toBe("<contato@ignews.com.br>");
    expect(lastEmail.subject).toBe("Último email enviado");
    const SmtpFinishTextProtocol = "\r\n";
    expect(lastEmail.text).toBe(
      "Corpo do último email enviado".concat(SmtpFinishTextProtocol),
    );
  });
});
