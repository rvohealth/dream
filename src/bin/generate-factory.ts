import initializeDream from '../helpers/initializeDream'
import generateFactory from '../helpers/cli/generateFactory'

async function _generateDream() {
  await initializeDream()

  const argv = process.argv.filter(arg => !/^--/.test(arg))
  const name = argv[2]
  const args = argv.slice(3, argv.length)
  await generateFactory(name, args)
  process.exit()
}

// eslint-disable-next-line
_generateDream()
