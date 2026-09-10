import bcryptjs from "bcryptjs";

async function hash(password) {
  return await bcryptjs.hash(password, numberOfRounds());
}

async function compare(password, hashedPassword) {
  return await bcryptjs.compare(password, hashedPassword);
}

function numberOfRounds() {
  const ROUNDS_DEVELOPMENT = 1;
  const ROUNDS_PRODUCTION = 14;

  return process.env.NODE_ENV === "development"
    ? ROUNDS_DEVELOPMENT
    : ROUNDS_PRODUCTION;
}

export const password = { hash, compare };
