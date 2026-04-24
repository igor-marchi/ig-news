const { exec } = require("node:child_process");

function checkDb() {
  exec("docker exec postgres-dev pg_isready --host localhost", handleReturn);

  function handleReturn(error, stdout) {
    if (stdout.search("accepting connections") === -1) {
      checkDb();
      return;
    }

    console.log("🟢 Está pronto e aceitando conexões.");
  }
}

console.log("🔴 Aguardando banco de dados aceitar conexões");
checkDb();
