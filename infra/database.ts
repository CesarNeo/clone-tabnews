import { Client } from "pg";

type TDatabaseQuery =
  | {
      text: string;
      values?: any[];
    }
  | string;

async function getNewClient() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: process.env.NODE_ENV === "production" ? true : false,
  });

  await client.connect();
  return client;
}

async function query(queryObject: TDatabaseQuery) {
  let client: Client | undefined;

  try {
    client = await getNewClient();

    const result = await client.query(queryObject);
    return result;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  } finally {
    await client.end();
  }
}

export default {
  query,
  getNewClient,
};
