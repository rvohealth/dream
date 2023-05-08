import * as fs from 'fs/promises'
import * as path from 'path'
import sspawn from '../../../src/helpers/sspawn'
import yarncmdRunByAppConsumer from './yarncmdRunByAppConsumer'
import { loadDreamYamlFile } from '../../../src/helpers/path'
import absoluteFilePath from '../../../src/helpers/absoluteFilePath'

export default async function maybeSyncExisting(programArgs: string[]) {
  const yamlConf = await loadDreamYamlFile()
  try {
    const pathToCheck = programArgs.includes('--core')
      ? process.cwd() + '/src/sync/schema.ts'
      : process.cwd() + '/../../node_modules/dream/src/sync/schema.ts'
    await fs.statfs(pathToCheck)
  } catch (_) {
    console.log('Missing schema file, resyncing app')
    await sspawn(yarncmdRunByAppConsumer('dream sync:existing', programArgs))
  }
}
