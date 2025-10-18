import { beforeAll, describe, test } from "@jest/globals";
import email from "infra/email";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.ts", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: "CesarNeo <cesarneo@example.com>",
      to: "contato@example.com",
      subject: "Test Email",
      text: "This is a test email sent from the integration test.",
    });

    await email.send({
      from: "CesarNeo <cesarneo@example.com>",
      to: "contato@example.com",
      subject: "Last Email",
      text: "This is the last email sent from the integration test.",
    });

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<cesarneo@example.com>");
    expect(lastEmail.recipients[0]).toBe("<contato@example.com>");
    expect(lastEmail.subject).toBe("Last Email");
    expect(lastEmail.text).toBe(
      "This is the last email sent from the integration test.\n",
    );
  });
});
