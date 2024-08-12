import '../helpers/loadEnv'

import { initializeDreamApplication } from '../app/conf/dream'
import SchemaBuilder from '../helpers/cli/SchemaBuilder'

export default async function buildDreamSchema() {
  await initializeDreamApplication()

  console.log('writing dream schema...')
  await new SchemaBuilder().build()
  console.log('Done!')
  process.exit()
}

void buildDreamSchema()
