import initializeDream from '../helpers/initializeDream'
import generateDream from '../helpers/cli/generateDream'

async function _generateDream() {
  await initializeDream()

  const argv = process.argv.filter(arg => !/^--/.test(arg))
  const name = argv[2]
  const args = argv.slice(3, argv.length)
  await generateDream(name, args)
  process.exit()
}

// eslint-disable-next-line
_generateDream()
