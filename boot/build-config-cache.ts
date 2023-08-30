import './cli/helpers/loadAppEnvFromBoot'
import path from 'path'
import { promises as fs } from 'fs'
import compact from '../shared/helpers/compact'
import dreamRootPath from '../shared/helpers/path/dreamRootPath'
import loadDbConfigYamlFile from '../shared/helpers/path/loadDbConfigYamlFile'
import projectRootPath from '../shared/helpers/path/projectRootPath'

export default async function buildConfigCache() {
  const dbConf = await loadDbConfigYamlFile()

  console.log('writing config cache...')
  let fileStr = `\
export default {
  db: ${JSON.stringify(dbConf, null, 2)},
}
  `

  let distSyncPathParts = compact([dreamRootPath(), 'dist', 'src', 'sync'])
  let rootSyncPathParts = compact([dreamRootPath(), 'src', 'sync'])
  const filePath = path.join(...distSyncPathParts, 'config-cache.ts')
  const originalFilePath = path.join(...rootSyncPathParts, 'config-cache.ts')

  await fs.mkdir(path.join(...distSyncPathParts), { recursive: true })
  await fs.writeFile(filePath, fileStr)
  await fs.writeFile(originalFilePath, fileStr)
  console.log('Done!')
  process.exit()
}
buildConfigCache()
