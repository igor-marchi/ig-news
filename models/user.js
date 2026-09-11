import database from "infra/database";
import { NotFoundError, ValidationError } from "infra/errors";
import { password } from "models/password";

async function findOneByUserName(username) {
  const userFound = await runSelectQuery(username);
  return userFound;

  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
      SELECT
        *
      FROM 
        users
      WHERE 
        username = $1
      LIMIT 1
      ;`,
      values: [username.trim().toLowerCase()],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
      });
    }

    return results.rows[0];
  }
}

async function create(userInputValues) {
  await validateUniqueUsername(userInputValues.username);
  await validateUniqueEmail(userInputValues.email);
  await hashPasswordInObject(userInputValues);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function hashPasswordInObject(userInputValues) {
    const hashedPassword = await password.hash(userInputValues.password);
    userInputValues.password = hashedPassword;
  }

  async function runInsertQuery(userInputValues) {
    const results = await database.query({
      text: `
      INSERT INTO 
        users (username, email, password) 
      VALUES 
        ($1, $2, $3)
      RETURNING
        *
      ;`,
      values: [
        userInputValues.username.trim().toLowerCase(),
        userInputValues.email.trim().toLowerCase(),
        userInputValues.password,
      ],
    });

    return results.rows[0];
  }
}

async function validateUniqueEmail(email) {
  if (!email) return;

  const formattedEmail = email.trim().toLowerCase();
  if (!formattedEmail) return;

  const results = await database.query({
    text: `
      SELECT
        email
      FROM 
        users
      WHERE 
        email = $1
      LIMIT 1
      ;`,
    values: [formattedEmail],
  });

  if (results.rowCount !== 0) {
    throw new ValidationError({
      message: "O email informado já está sendo utilizado",
      action: "Utilize outro email para realizar esta operação",
    });
  }

  return;
}

async function validateUniqueUsername(username) {
  if (!username) return;

  const formattedUsername = username.trim().toLowerCase();
  if (!formattedUsername) return;

  const results = await database.query({
    text: `
      SELECT
        username
      FROM 
        users
      WHERE 
        username = $1
      LIMIT 1
      ;`,
    values: [formattedUsername],
  });

  if (results.rowCount !== 0) {
    throw new ValidationError({
      message: "O username informado já está sendo utilizado",
      action: "Utilize outro username para realizar esta operação",
    });
  }

  return;
}

async function update(username, userInputValues) {
  const currentUser = await findOneByUserName(username);

  if ("username" in userInputValues) {
    await validateUniqueUsername(userInputValues.username);
  }

  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues.email);
  }
}

export const user = {
  create,
  findOneByUserName,
  update,
};
