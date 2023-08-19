import './cli/helpers/loadAppEnvFromBoot'
import path from 'path'
import { promises as fs } from 'fs'
import compact from '../shared/helpers/compact'
import loadDbConfigYamlFile from '../shared/helpers/path/loadDbConfigYamlFile'

export default async function buildConfigCache() {
  const dbConf = await loadDbConfigYamlFile()

  console.log('writing config cache...')
  let fileStr = `\
export default {
  db: ${JSON.stringify(dbConf, null, 2)},
}
  `

  let distSyncPathParts = compact([
    __dirname,
    process.env.DREAM_OMIT_DIST_FOLDER === '1' ? null : '..',
    'src',
    'sync',
  ])
  let rootSyncPathParts = compact([
    __dirname,
    '..',
    process.env.DREAM_OMIT_DIST_FOLDER === '1' ? null : '..',
    'src',
    'sync',
  ])
  const filePath = path.join(...distSyncPathParts, 'config-cache.ts')
  const originalFilePath = path.join(...rootSyncPathParts, 'config-cache.ts')

  await fs.mkdir(path.join(...distSyncPathParts), { recursive: true })
  await fs.writeFile(filePath, fileStr)
  await fs.writeFile(originalFilePath, fileStr)
  console.log('Done!')
  process.exit()
}
buildConfigCache()
