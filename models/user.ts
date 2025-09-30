import database from "infra/database";
import { NotFoundError, ValidationError } from "infra/errors";
import password from "./password";

interface ICreateUserParams {
  username: string;
  email: string;
  password: string;
}

type TUser = {
  id: string;
  username: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
};

async function create(userInputValues: ICreateUserParams) {
  await validateUniqueUsername(userInputValues.username);
  await validateUniqueEmail(userInputValues.email);
  await hashPasswordInObject(userInputValues);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function runInsertQuery(userInputValues: ICreateUserParams) {
    const { username, email, password } = userInputValues;
    const result = await database.query({
      text: `
      INSERT INTO 
        users (username, email, password) 
      VALUES
        ($1, $2, $3)
      RETURNING
        *
      ;`,
      values: [username, email, password],
    });

    return result.rows[0];
  }
}

async function findOneByUsername(username: string | string[]) {
  const userFound = await runSelectQuery(username);
  return userFound;

  async function runSelectQuery(username: string | string[]) {
    const result = await database.query({
      text: `
      SELECT 
        *
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      LIMIT 
        1
      ;`,
      values: [username],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique o username e tente novamente.",
      });
    }

    return result.rows[0];
  }
}

async function update(
  username: string | string[],
  userInputValues: Partial<ICreateUserParams>,
) {
  const currentUser = await findOneByUsername(username);

  if ("username" in userInputValues) {
    await validateUniqueUsername(userInputValues.username);
  }

  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues.email);
  }

  if ("password" in userInputValues) {
    await hashPasswordInObject(userInputValues);
  }

  const userWithUpdatedValues = {
    ...currentUser,
    ...userInputValues,
  };

  const updatedUser = await runUpdateQuery(userWithUpdatedValues);
  return updatedUser;

  async function runUpdateQuery({ id, username, email, password }: TUser) {
    const results = await database.query({
      text: `
        UPDATE 
          users
        SET
          username = $2,
          email = $3,
          password = $4,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
        ;
      `,
      values: [id, username, email, password],
    });

    return results.rows[0];
  }
}

async function validateUniqueUsername(username: string) {
  const result = await database.query({
    text: `
      SELECT 
        username
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      ;`,
    values: [username],
  });

  if (result.rowCount > 0) {
    throw new ValidationError({
      message: "O nome de usuário já está sendo usado por outro usuário.",
      action: "Utilize outro nome de usuário para está operação.",
    });
  }
}

async function validateUniqueEmail(email: string) {
  const result = await database.query({
    text: `
      SELECT 
        email
      FROM
        users
      WHERE
        LOWER(email) = LOWER($1)
      ;`,
    values: [email],
  });

  if (result.rowCount > 0) {
    throw new ValidationError({
      message: "O email já está sendo usado por outro usuário.",
      action: "Utilize outro email para está operação.",
    });
  }
}

async function hashPasswordInObject(
  userInputValues: Partial<ICreateUserParams>,
) {
  const hashedPassword = await password.hash(userInputValues.password);
  userInputValues.password = hashedPassword;
}

const user = {
  create,
  findOneByUsername,
  update,
};

export default user;
