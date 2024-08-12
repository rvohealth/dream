import DreamApplication from '../dream-application'
import generateMigration from '../helpers/cli/generateMigration'
import initializeDream from '../helpers/initializeDream'

async function _generateMigration() {
  await DreamApplication.configure()
  await initializeDream()

  const argv = process.argv.filter(arg => !/^--/.test(arg))
  const name = argv[2]
  await generateMigration(name)
  process.exit()
}

void _generateMigration()
