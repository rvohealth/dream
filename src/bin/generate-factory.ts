import DreamApplication from '../dream-application'
import generateFactory from '../helpers/cli/generateFactory'
import initializeDream from '../helpers/initializeDream'

async function _generateDream() {
  await DreamApplication.configure()
  await initializeDream()

  const argv = process.argv.filter(arg => !/^--/.test(arg))
  const name = argv[2]
  const args = argv.slice(3, argv.length)
  await generateFactory(name, args)
  process.exit()
}

void _generateDream()
