import DreamApplication from '../dream-application'
import initializeDream from '../helpers/initializeDream'
import '../helpers/loadEnv'
import { dbSeedPath } from '../helpers/path'

async function dbSeed() {
  await DreamApplication.configure()
  await initializeDream()

  console.log('seeding db...')
  const seed = await import(await dbSeedPath())

  if (!seed.default) throw 'db/seed.ts file must have an async function as the default export'

  await seed.default()

  console.log('done seeding db!')
  process.exit()
}

void dbSeed()
