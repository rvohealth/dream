import '../helpers/loadEnv'
import * as path from 'path'
import { promises as fs } from 'fs'
import loadModels from '../helpers/loadModels'

export default async function copyModels() {
  console.log('syncing models...')
  await writeModels()

  console.log('model writing complete!')
}
copyModels()

async function writeModels() {
  const models = await loadModels()
  const filePath = path.join(__dirname, '..', 'sync', 'models.ts')
  const relativePathToModels =
    process.env.CORE_DEVELOPMENT === '1'
      ? path.join('..', 'test-app', 'app', 'models')
      : path.join('..', '..', '..', '..', 'src', 'app', 'models')

  const importStatements = Object.keys(models)
    .map(key => `import ${models[key].name} from '${relativePathToModels + '/' + key.replace(/\.ts$/, '')}'`)
    .join('\n')

  const str = `\
${importStatements}

export default {
${Object.keys(models).map(key => `  "${key.replace(/\.ts/, '')}": ${models[key].name}`)}
}
`
  await fs.writeFile(filePath, str)
}
