import * as fs from 'fs/promises'
import buildNewDreamApp from './helpers/buildNewDreamApp.js'
import { InitDreamAppCliOptions } from './helpers/primaryKeyTypes.js'

export default async function newDreamApp(appName: string, options: InitDreamAppCliOptions) {
  const projectPath = `./${appName}`
  await fs.mkdir(projectPath)
  await buildNewDreamApp(appName, projectPath, options)
}
