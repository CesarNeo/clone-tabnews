import migrationRunner, { type RunnerOption } from "node-pg-migrate";
import { resolve } from "node:path";
import type { NextApiRequest, NextApiResponse } from "next";
import database from "infra/database";
import { createRouter } from "next-connect";
import controller from "infra/controller";

const router = createRouter();
router.get(getHandler).post(postHandler);

export default router.handler(controller.errorHandlers);

const defaultMigrationOptions = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
} as RunnerOption;

async function getHandler(request: NextApiRequest, response: NextApiResponse) {
  const dbClient = await database.getNewClient();

  try {
    const pendingMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
    });
    response.status(200).json(pendingMigrations);
  } finally {
    await dbClient.end();
  }
}

async function postHandler(request: NextApiRequest, response: NextApiResponse) {
  const dbClient = await database.getNewClient();

  try {
    const migratedMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dryRun: false,
      dbClient,
    });

    if (migratedMigrations.length > 0) {
      response.status(201).json(migratedMigrations);
      return;
    }

    response.status(200).json(migratedMigrations);
  } finally {
    await dbClient.end();
  }
}
