import migrationRunner, { type RunnerOption } from "node-pg-migrate";
import { join } from "node:path";
import type { NextApiRequest, NextApiResponse } from "next";
import database from "infra/database";
import type { Client } from "pg";

const ALLOWED_METHODS = ["GET", "POST"];

export default async function migrations(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  if (!ALLOWED_METHODS.includes(request.method)) {
    return response.status(405).end({
      error: `Method Not Allowed: ${request.method}`,
    });
  }
  let dbClient: Client;

  try {
    dbClient = await database.getNewClient();
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
      response.status(200).json(pendingMigrations);
    }

    if (request.method === "POST") {
      const migratedMigrations = await migrationRunner({
        ...defaultMigrationOptions,
        dryRun: false,
      });

      if (migratedMigrations.length > 0) {
        response.status(201).json(migratedMigrations);
      }

      response.status(200).json(migratedMigrations);
    }
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  } finally {
    await dbClient.end();
  }
}
