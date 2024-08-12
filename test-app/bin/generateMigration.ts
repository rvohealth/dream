import { initializeDreamApplication } from '../app/conf/dream'
import generateMigration from '../helpers/cli/generateMigration'

async function _generateMigration() {
  await initializeDreamApplication()

  const argv = process.argv.filter(arg => !/^--/.test(arg))
  const name = argv[2]
  await generateMigration(name)
  process.exit()
}

void _generateMigration()
