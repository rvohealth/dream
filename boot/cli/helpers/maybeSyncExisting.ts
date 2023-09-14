import fs from 'fs/promises'
import path from 'path'
import sspawn from '../../../shared/helpers/sspawn'
import developmentOrTestEnv from './developmentOrTestEnv'
import dreamjsOrDreamtsCmd from './dreamjsOrDreamtsCmd'

export default async function maybeSyncExisting(programArgs: string[]) {
  if (!developmentOrTestEnv() || programArgs.includes('--bypass-config-cache')) return

  try {
    const pathToCheck = programArgs.includes('--core')
      ? path.join(process.cwd(), '/src/sync/schema.ts')
      : path.join(process.cwd(), '/../../node_modules/dream/src/sync/schema.ts')
    await fs.statfs(pathToCheck)
  } catch (_) {
    console.log('Missing schema file, resyncing app')
    await sspawn(dreamjsOrDreamtsCmd('sync:existing', programArgs))
  }
}
