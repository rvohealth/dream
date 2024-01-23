import initializeDream from '../../shared/helpers/initializeDream'
import generateMigration from '../helpers/cli/generateMigration'

async function _generateMigration() {
  await initializeDream()

  const argv = process.argv.filter(arg => !/^--/.test(arg))
  let name = argv[2]
  const args = argv.slice(3, argv.length)
  await generateMigration(name)
  process.exit()
}

// eslint-disable-next-line
_generateMigration()
