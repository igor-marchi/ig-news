import crypto from "node:crypto";
import database from "infra/database";
import { UnauthorizedError } from "infra/errors";

const EXPIRATION_IN_MILLISECONDS = 30 * 24 * 60 * 60 * 1000; // 30 days

async function findOneValidByToken(token) {
  const sessionFound = await runSelectQuery(token);

  return sessionFound;

  async function runSelectQuery(token) {
    const results = await database.query({
      text: `
        SELECT *
        FROM sessions
        WHERE token = $1 AND expires_at > NOW()
        LIMIT 1;
      `,
      values: [token],
    });

    if (results.rowCount === 0) {
      throw new UnauthorizedError({
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
      });
    }

    return results.rows[0];
  }
}
async function create(userId) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
  const newSession = await runInsertQuery(token, userId, expiresAt);

  return newSession;

  async function runInsertQuery(token, userId, expiresAt) {
    const result = await database.query({
      text: `
        INSERT INTO sessions (token, user_id, expires_at)
        VALUES ($1, $2, $3)
        RETURNING *;
      `,
      values: [token, userId, expiresAt],
    });

    return result.rows[0];
  }
}

async function renew(sessionId) {
  const newExpiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
  const renewedSession = await runUpdateQuery(sessionId, newExpiresAt);

  return renewedSession;

  async function runUpdateQuery(sessionId, expiresAt) {
    const results = await database.query({
      text: `
        UPDATE sessions
        SET expires_at = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *;
      `,
      values: [expiresAt, sessionId],
    });

    return results.rows[0];
  }
}

async function expireById(sessionId) {
  const expiredSession = await runUpdateQuery(sessionId);
  return expiredSession;

  async function runUpdateQuery(sessionId) {
    const results = await database.query({
      text: `
        UPDATE sessions
        SET expires_at = NOW(), updated_at = NOW()
        WHERE id = $1
        RETURNING *;
      `,
      values: [sessionId],
    });

    return results.rows[0];
  }
}

const session = {
  EXPIRATION_IN_MILLISECONDS,
  create,
  renew,
  expireById,
  findOneValidByToken,
};

export { session };
