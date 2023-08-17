import generateDream from '../helpers/cli/generateDream'

async function _generateDream() {
  let name = process.argv[2]
  const args = process.argv.slice(3, process.argv.length)
  await generateDream(name, args)
}
_generateDream()
