import database from "infra/database";
import { ValidationError } from "infra/errors";

interface ICreateUserParams {
  username: string;
  email: string;
  password: string;
}

async function create(userInputValues: ICreateUserParams) {
  await validateUniqueEmail(userInputValues.email);
  await validateUniqueUsername(userInputValues.username);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

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
        action: "Utilize outro nome de usuário para se cadastrar.",
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
        action: "Utilize outro email para se cadastrar.",
      });
    }
  }

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

const user = {
  create,
};

export default user;
