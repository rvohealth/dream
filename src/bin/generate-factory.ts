import Dreamconf from '../dreamconf'
import generateFactory from '../helpers/cli/generateFactory'
import initializeDream from '../helpers/initializeDream'

async function _generateDream() {
  await Dreamconf.loadAndApplyConfig()
  await initializeDream()

  const argv = process.argv.filter(arg => !/^--/.test(arg))
  const name = argv[2]
  const args = argv.slice(3, argv.length)
  await generateFactory(name, args)
  process.exit()
}

void _generateDream()
