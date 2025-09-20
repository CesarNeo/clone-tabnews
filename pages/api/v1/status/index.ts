import database from "infra/database";
import { InternalServerError, MethodNotAllowedError } from "infra/errors";

import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

const router = createRouter();
router.get(getHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

async function onNoMatchHandler(_: NextApiRequest, response: NextApiResponse) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

async function onErrorHandler(
  error: Error,
  _: NextApiRequest,
  response: NextApiResponse,
) {
  const publicErrorObject = new InternalServerError({
    cause: error,
  });
  console.error(
    "🚀 ~ Erro dentro do catch do next-connect:",
    publicErrorObject,
  );

  response.status(500).json(publicErrorObject);
}

async function getHandler(_: NextApiRequest, response: NextApiResponse) {
  const updatedAt = new Date().toISOString();
  const databaseQueryVersion = await database.query("SHOW server_version;");
  const databaseVersion = databaseQueryVersion.rows[0].server_version;

  const maxConnectionsQuery = await database.query("SHOW max_connections;");
  const maxConnections = maxConnectionsQuery.rows[0].max_connections;
  const databaseName = process.env.POSTGRES_DB;
  const maxConnectionsActiveQuery = await database.query({
    text: "SELECT COUNT(*)::int FROM pg_stat_activity WHERE datname = $1;",
    values: [databaseName],
  });
  const maxConnectionsActive = maxConnectionsActiveQuery.rows[0].count;

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: databaseVersion,
        max_connections: parseInt(maxConnections),
        opened_connections: maxConnectionsActive,
      },
    },
  });
}
