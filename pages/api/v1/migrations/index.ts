import migrationRunner, { type RunnerOption } from "node-pg-migrate";
import { join } from "node:path";
import type { NextApiRequest, NextApiResponse } from "next";
import database from "infra/database";

export default async function migrations(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const dbClient = await database.getNewClient();
  const defaultMigrationOptions = {
    dbClient,
    dryRun: true,
    dir: join("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  } satisfies RunnerOption;

  if (request.method === "GET") {
    const pendingMigrations = await migrationRunner(defaultMigrationOptions);
    await dbClient.end();
    response.status(200).json(pendingMigrations);
  }

  if (request.method === "POST") {
    const migratedMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dryRun: false,
    });
    await dbClient.end();

    if (migratedMigrations.length > 0) {
      response.status(201).json(migratedMigrations);
    }

    response.status(200).json(migratedMigrations);
  }

  return response.status(405).end();
}
