import Dreamconf from '../dreamconf'
import generateSerializer from '../helpers/cli/generateSerializer'
import initializeDream from '../helpers/initializeDream'

async function _generateSerializer() {
  await Dreamconf.loadAndApplyConfig()
  await initializeDream()

  const argv = process.argv.filter(arg => !/^--/.test(arg))
  const name = argv[2]
  const args = argv.slice(3, argv.length)
  await generateSerializer(name, args)
  process.exit()
}

void _generateSerializer()
