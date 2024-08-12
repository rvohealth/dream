import DreamApplication from '../dream-application'
import SchemaBuilder from '../helpers/cli/SchemaBuilder'
import initializeDream from '../helpers/initializeDream'
import '../helpers/loadEnv'

export default async function buildAssociations() {
  await DreamApplication.configure()
  await initializeDream()

  console.log('writing dream schema...')
  await new SchemaBuilder().build()
  console.log('Done!')
  process.exit()
}

void buildAssociations()
