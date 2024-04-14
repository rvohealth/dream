import initializeDream from '../helpers/initializeDream'
import generateMigration from '../helpers/cli/generateMigration'

async function _generateMigration() {
  await initializeDream()

  const argv = process.argv.filter(arg => !/^--/.test(arg))
  const name = argv[2]
  await generateMigration(name)
  process.exit()
}

// eslint-disable-next-line
_generateMigration()
