import database from "infra/database";
import email from "infra/email.js";
import { webserver } from "infra/webserver";

const EXPIRATION_IN_MILLISECONDS = 1000 * 60 * 15; // 15 minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
      INSERT INTO 
        user_activation_tokens (user_id, expires_at)
      VALUES ($1, $2)
      RETURNING *;
    `,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function findOneByUserId(userId) {
  const token = await runSelectQuery(userId);
  return token;

  async function runSelectQuery(userId) {
    const results = await database.query({
      text: `
      SELECT 
        *
      FROM 
        user_activation_tokens
      WHERE 
        user_id = $1
      LIMIT 1;
    `,
      values: [userId],
    });

    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "Ignews <contato@ignews.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no Ignews!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no Ignews:

${webserver.origin}/cadastro/ativar/${activationToken.id}

Atenciosamente, 
Equipe Ignews`,
  });
}

export const activation = {
  findOneByUserId,
  create,
  sendEmailToUser,
};
