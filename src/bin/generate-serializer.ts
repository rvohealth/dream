import generateSerializer from '../helpers/cli/generateSerializer'

async function _generateSerializer() {
  const argv = process.argv.filter(arg => !/^--/.test(arg))
  let name = argv[2]
  const args = argv.slice(3, argv.length)
  await generateSerializer(name, args)
}
_generateSerializer()
