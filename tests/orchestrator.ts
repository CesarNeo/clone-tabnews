import retry from "async-retry";
import database from "infra/database";
import migrator from "models/migrator";
import type { ICreateUserParams } from "models/user";
import user from "models/user";
import { faker } from "@faker-js/faker";

async function waitForAllServices() {
  async function waitForWebServer() {
    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");

      if (response.status !== 200) throw new Error();
    }

    return retry(fetchStatusPage, { retries: 100, maxTimeout: 5000 });
  }

  await waitForWebServer();
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

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
};

export default orchestrator;
