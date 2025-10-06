import { NotFoundError, UnauthorizedError } from "infra/errors";
import user from "./user";
import password from "./password";

async function getAuthenticatedUser(email: string, userPassword: string) {
  try {
    const storedUser = await findUserByEmail(email);
    await validatePassword(userPassword, storedUser.password);

    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Dados de autenticação inválidos.",
        action: "Verifique os dados e tente novamente.",
      });
    }

    throw error;
  }

  async function findUserByEmail(email: string) {
    let storedUser;

    try {
      storedUser = await user.findOneByEmail(email);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "Email incorreto.",
          action: "Tente novamente com o email correto.",
        });
      }

      throw error;
    }
    return storedUser;
  }

  async function validatePassword(
    userPassword: string,
    storedPassword: string,
  ) {
    const correctPasswordMatch = await password.compare(
      userPassword,
      storedPassword,
    );

    if (!correctPasswordMatch) {
      throw new UnauthorizedError({
        message: "Senha incorreta.",
        action: "Tente novamente com a senha correta.",
      });
    }
  }
}

const authentication = {
  getAuthenticatedUser,
};

export default authentication;
