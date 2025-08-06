import database from "infra/database";

import type { NextApiRequest, NextApiResponse } from "next";

async function status(request: NextApiRequest, response: NextApiResponse) {
  const result = await database.query("SELECT 1 + 1;");
  console.log(result);
  response.status(200).json({ chave: "valor" });
}

export default status;
