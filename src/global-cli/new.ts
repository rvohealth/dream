import fs from 'fs/promises'
import buildNewDreamApp from './helpers/buildNewDreamApp'

export default async function newDreamApp(appName: string, args: string[]) {
  const projectPath = `./${appName}`
  await fs.mkdir(projectPath)
  await buildNewDreamApp(appName, projectPath, args)
}
