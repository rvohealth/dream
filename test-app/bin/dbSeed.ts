import '../helpers/loadEnv'

import { initializeDreamApplication } from '../app/conf/dream'
import { dbSeedPath } from '../helpers/path'

async function dbSeed() {
  await initializeDreamApplication()

  console.log('seeding db...')
  const seed = await import(await dbSeedPath())

  if (!seed.default) throw 'db/seed.ts file must have an async function as the default export'

  await seed.default()

  console.log('done seeding db!')
  process.exit()
}

void dbSeed()
