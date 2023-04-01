import * as path from 'path'
import { promises as fs } from 'fs'
import loadModels from '../helpers/loadModels'
import sspawn from '../helpers/sspawn'
import { dreamYamlConfig } from '../helpers/path'

export default async function sync() {
  console.log('copying schema and dream config...')
  await sspawn(
    'rm -rf src/sync && mkdir src/sync && ' +
      'cp ./src/test-app/db/schema.ts ./src/sync && ' +
      'cp ./src/test-app/conf/dream.ts ./src/sync'
  )

  console.log('syncing models...')
  await writeModels()
}
sync()

async function writeModels() {
  const models = await loadModels()
  const filePath = path.join(__dirname, '..', 'sync', 'models.ts')
  const relativePathToModels =
    process.env.CORE_DEVELOPMENT === '1'
      ? path.join('..', 'test-app', 'app', 'models')
      : path.join('..', '..', '..', 'src', 'app', 'models')

  const importStatements = Object.keys(models)
    .map(key => `import ${models[key].name} from '${relativePathToModels + '/' + key.replace(/\.ts$/, '')}'`)
    .join('\n')

  const str = `\
${importStatements}

export default {
${Object.keys(models).map(key => `  "${key.replace(/\.ts/, '')}": ${models[key].name}`)}
}
`
  console.log(await dreamYamlConfig())
  await fs.writeFile(filePath, str)
}
