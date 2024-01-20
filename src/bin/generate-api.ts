import initializeDream from '../../shared/helpers/initializeDream'
import generateApiSchema from '../helpers/cli/generateApiSchema'
import generateDream from '../helpers/cli/generateDream'

async function _generateApi() {
  await initializeDream()
  await generateApiSchema()
}

// eslint-disable-next-line
_generateApi()
