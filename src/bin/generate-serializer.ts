import generateSerializer from '../helpers/cli/generateSerializer'

async function _generateSerializer() {
  let name = process.argv[2]
  const args = process.argv.slice(3, process.argv.length)
  await generateSerializer(name, args)
}
_generateSerializer()
