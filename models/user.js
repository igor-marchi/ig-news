import database from "infra/database";
import { ValidationError } from "infra/errors";

async function create(userInputValues) {
  await validate(userInputValues);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function validate(userInputValues) {
    const email = userInputValues.email.trim().toLowerCase();
    const username = userInputValues.username.trim().toLowerCase();

    const results = await database.query({
      text: `
      SELECT
        email,
        username
      FROM 
        users
      WHERE 
        email = $1 OR username = $2
      LIMIT 1
      ;`,
      values: [email, username],
    });

    console.log(results.rowCount);

    if (results.rowCount === 0) return;

    const user = results.rows[0];
    if (!user) return;

    if (user.email == email) {
      throw new ValidationError({
        message: "O email informado já está sendo utilizado ",
        action: "Utilize outro email para realizar o cadastro",
      });
    }

    if (user.username == username) {
      throw new ValidationError({
        message: "O username informado já está sendo utilizado ",
        action: "Utilize outro username para realizar o cadastro",
      });
    }
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

export const user = {
  create,
};
