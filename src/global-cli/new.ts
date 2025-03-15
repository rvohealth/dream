import * as fs from 'fs/promises'
import buildNewDreamApp from './helpers/buildNewDreamApp.js.js'
import { InitDreamAppCliOptions } from './helpers/primaryKeyTypes.js.js'

export default async function newDreamApp(appName: string, options: InitDreamAppCliOptions) {
  const projectPath = `./${appName}`
  await fs.mkdir(projectPath)
  await buildNewDreamApp(appName, projectPath, options)
}
