import '../helpers/loadEnv'
import { dbSeedPath } from '../helpers/path'

async function dbSeed() {
  console.log('seeding db...')
  const seed = await import(await dbSeedPath())

  if (!seed.default) throw 'db/seed.ts file must have an async function as the default export'

  await seed.default()
  console.log('done!')
}

dbSeed()
