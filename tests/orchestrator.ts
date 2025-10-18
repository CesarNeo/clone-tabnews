import retry from "async-retry";
import database from "infra/database";
import migrator from "models/migrator";
import type { ICreateUserParams } from "models/user";
import user from "models/user";
import { faker } from "@faker-js/faker";
import session from "models/session";

const EMAIL_HTTP_URL = "http://".concat(
  process.env.EMAIL_HTTP_HOST,
  ":",
  process.env.EMAIL_HTTP_PORT,
);

async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer() {
    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");

      if (response.status !== 200) throw new Error();
    }

    return retry(fetchStatusPage, { retries: 100, maxTimeout: 5000 });
  }
  async function waitForEmailServer() {
    async function fetchEmailStatusPage() {
      const response = await fetch(EMAIL_HTTP_URL);

      if (response.status !== 200) throw new Error();
    }

    return retry(fetchEmailStatusPage, { retries: 100, maxTimeout: 5000 });
  }
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser({
  username,
  email,
  password,
}: Partial<ICreateUserParams> = {}) {
  return await user.create({
    username: username || faker.internet.username().replace(/[_.-]/g, ""),
    email: email || faker.internet.email(),
    password: password || "secure_password",
  });
}

async function createSession(userId: string) {
  return await session.create(userId);
}

async function deleteAllEmails() {
  await fetch(EMAIL_HTTP_URL.concat("/messages"), { method: "DELETE" });
}

async function getLastEmail() {
  const emailListResponse = await fetch(EMAIL_HTTP_URL.concat("/messages"));
  const emailListBody = await emailListResponse.json();
  const lastEmailItem = emailListBody.pop();

  const emailTextResponse = await fetch(
    EMAIL_HTTP_URL.concat("/messages/", lastEmailItem.id, ".plain"),
  );
  const emailTextBody = await emailTextResponse.text();
  lastEmailItem.text = emailTextBody;

  return lastEmailItem;
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  deleteAllEmails,
  getLastEmail,
};

export default orchestrator;
