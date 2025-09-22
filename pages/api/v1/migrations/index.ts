import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import controller from "infra/controller";
import migrator from "models/migrator";

const router = createRouter();
router.get(getHandler).post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(_: NextApiRequest, response: NextApiResponse) {
  const pendingMigrations = await migrator.listPendingMigrations();
  response.status(200).json(pendingMigrations);
}

async function postHandler(_: NextApiRequest, response: NextApiResponse) {
  const migratedMigrations = await migrator.runPendingMigrations();

  if (migratedMigrations.length > 0) {
    response.status(201).json(migratedMigrations);
    return;
  }

  response.status(200).json(migratedMigrations);
}
