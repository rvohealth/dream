import generateMigration from '../helpers/cli/generateMigration'

async function _generateMigration() {
  const argv = process.argv.filter(arg => !/^--/.test(arg))
  let name = argv[2]
  const args = argv.slice(3, argv.length)
  await generateMigration(name)
}
_generateMigration()
