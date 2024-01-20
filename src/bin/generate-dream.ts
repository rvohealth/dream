import initializeDream from '../../shared/helpers/initializeDream'
import generateDream from '../helpers/cli/generateDream'

async function _generateDream() {
  await initializeDream()

  const argv = process.argv.filter(arg => !/^--/.test(arg))
  let name = argv[2]
  const args = argv.slice(3, argv.length)
  await generateDream(name, args)
}

// eslint-disable-next-line
_generateDream()
