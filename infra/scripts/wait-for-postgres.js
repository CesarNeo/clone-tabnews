const { exec } = require('node:child_process')

function checkPostgres() {
  function handleReturn(error, stdout) {
    if (stdout.search('accepting connections') === -1) {
      process.stdout.write('.')
      checkPostgres()
      return
    }

    console.log('\n🟩 PostgreSQL is ready!\n')
  }

  exec('docker exec postgres-dev pg_isready --host localhost', handleReturn)
}

process.stdout.write("\n\n🟥 Waiting for PostgreSQL to be ready")
checkPostgres();