import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user";

const router = createRouter();
router.get(getHandler).patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request: NextApiRequest, response: NextApiResponse) {
  const { username } = request.query;
  const userFound = await user.findOneByUsername(username);

  return response.status(200).json(userFound);
}

async function patchHandler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const { username } = request.query;
  const userInputValues = request.body;
  const updatedUser = await user.update(username, userInputValues);

  return response.status(200).json(updatedUser);
}
