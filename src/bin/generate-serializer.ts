import initializeDream from '../helpers/initializeDream'
import generateSerializer from '../helpers/cli/generateSerializer'

async function _generateSerializer() {
  await initializeDream()

  const argv = process.argv.filter(arg => !/^--/.test(arg))
  const name = argv[2]
  const args = argv.slice(3, argv.length)
  await generateSerializer(name, args)
  process.exit()
}

void _generateSerializer()
