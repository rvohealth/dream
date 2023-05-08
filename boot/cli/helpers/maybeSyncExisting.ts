import * as fs from 'fs/promises'
import * as path from 'path'
import sspawn from '../../../src/helpers/sspawn'
import yarncmdRunByAppConsumer from './yarncmdRunByAppConsumer'
import { loadDreamYamlFile } from '../../../src/helpers/path'
import absoluteFilePath from '../../../src/helpers/absoluteFilePath'

export default async function maybeSyncExisting(programArgs: string[]) {
  const yamlConf = await loadDreamYamlFile()
  try {
    console.log('DEBUGGING', absoluteFilePath(yamlConf.schema_path))
    await fs.statfs(absoluteFilePath(yamlConf.schema_path))
  } catch (_) {
    console.log('Missing schema file, resyncing app')
    await sspawn(yarncmdRunByAppConsumer('dream sync:existing', programArgs))
  }
}
