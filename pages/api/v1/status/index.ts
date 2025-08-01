import type { NextApiRequest, NextApiResponse } from "next";

function status(request: NextApiRequest, response: NextApiResponse) {
  response.status(200).json({ chave: "valor" });
}

export default status;
