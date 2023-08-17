import './cli/helpers/loadEnv'
import path from 'path'
import { promises as fs } from 'fs'
import { loadDbConfigYamlFile } from './cli/helpers/path'

export default async function buildConfigCache() {
  const dbConf = await loadDbConfigYamlFile()

  console.log('writing config cache...')
  let fileStr = `\
export default {
  db: ${JSON.stringify(dbConf, null, 2)},
}
  `

  await fs.mkdir(path.join(__dirname, '..', 'src', 'sync'), { recursive: true })
  const filePath = path.join(__dirname, '..', 'src', 'sync', 'config-cache.ts')
  await fs.writeFile(filePath, fileStr)
  console.log('Done!')
}
buildConfigCache()
