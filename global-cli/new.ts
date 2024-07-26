import fs from 'fs/promises'
import installCoreDreamDependenciesToDir from './installCoreDreamDependenciesToDir'

export default async function newDreamApp(appName: string, args: string[]) {
  const projectPath = `./${appName}`
  await fs.mkdir(projectPath)
  await installCoreDreamDependenciesToDir(appName, projectPath, args)
}
