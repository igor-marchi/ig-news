import database from "infra/database";
import { InternalServerError } from "infra/errors";

export default async function status(request, response) {
  try {
    const databaseVersionResult = await database.query("SHOW server_version;");
    const databaseVersion = databaseVersionResult.rows[0].server_version;

    const databaseMaxConnectionsResult = await database.query(
      "SHOW max_connections;",
    );
    const databaseMaxConnections =
      databaseMaxConnectionsResult.rows[0].max_connections;

    const databaseOpenedConnectionsResult = await database.query({
      text: "SELECT count(1)::int from pg_stat_activity WHERE datname = $1;",
      values: [process.env.POSTGRES_DB],
    });

    const databaseOpenedConnectionsValue =
      databaseOpenedConnectionsResult.rows[0].count;

    response.status(200).json({
      updated_at: new Date().toISOString(),
      dependencies: {
        database: {
          version: databaseVersion,
          max_connections: parseInt(databaseMaxConnections),
          opened_connections: databaseOpenedConnectionsValue,
        },
      },
    });
  } catch (error) {
    console.log("\n Erro dentro do controller status:");
    console.log(error);
    const publicErrorObject = new InternalServerError({
      cause: error,
    });
    console.log(publicErrorObject);

    response.status(500).json(publicErrorObject);
  }
}
