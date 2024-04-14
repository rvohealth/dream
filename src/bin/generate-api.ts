import initializeDream from '../helpers/initializeDream'
import generateApiSchema from '../helpers/cli/generateApiSchema'

async function _generateApi() {
  await initializeDream()
  await generateApiSchema()
  process.exit()
}

// eslint-disable-next-line
_generateApi()
