import generateMigration from '../helpers/cli/generateMigration'

async function _generateMigration() {
  let name = process.argv[2]
  const args = process.argv.slice(3, process.argv.length)
  await generateMigration(name)
}
_generateMigration()
