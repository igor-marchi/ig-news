import { user } from "models/user";
import { password } from "models/password";
import { NotFoundError, UnauthorizedError } from "infra/errors";

async function getAuthenticatedUser(userEmail, userPassword) {
  try {
    const storedUser = await findUserByEmail(userEmail);
    await validatePassword(userPassword, storedUser.password);

    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Dados de autenticação inválidos.",
        action: "Verifique se os dados enviados estão corretos.",
      });
    }

    throw error;
  }

  async function findUserByEmail(userEmail) {
    try {
      const storedUser = await user.findOneByEmail(userEmail);
      return storedUser;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "Email não confere.",
          action: "Verifique se este dado está correto.",
        });
      }

      throw error;
    }
  }

  async function validatePassword(userPassword, storedUserPassword) {
    const correctPasswordMatch = await password.compare(
      userPassword,
      storedUserPassword,
    );

    if (!correctPasswordMatch) {
      throw new UnauthorizedError({
        message: "Senha não confere.",
        action: "Verifique se este dado está correto.",
      });
    }
  }
}

const authentication = {
  getAuthenticatedUser,
};

export { authentication };
