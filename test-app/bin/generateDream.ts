import { initializeDreamApplication } from '../app/conf/dream'
import generateDream from '../helpers/cli/generateDream'

async function _generateDream() {
  await initializeDreamApplication()

  const argv = process.argv.filter(arg => !/^--/.test(arg))
  const name = argv[2]
  const args = argv.slice(3, argv.length)
  await generateDream(name, args)
  process.exit()
}

void _generateDream()
