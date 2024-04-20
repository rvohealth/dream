import '../helpers/loadEnv'
import initializeDream from '../helpers/initializeDream'
import SchemaBuilder from '../helpers/cli/SchemaBuilder'

export default async function buildAssociations() {
  await initializeDream()

  console.log('writing dream schema...')
  await new SchemaBuilder().build()
  console.log('Done!')
  process.exit()
}

void buildAssociations()
