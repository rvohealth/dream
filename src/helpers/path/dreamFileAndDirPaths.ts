import path from 'path'
import { getCachedDreamApplicationOrFail } from '../../dream-application/cache'

export default function (relDirPath: string, partialFilePath: string) {
  const dreamApp = getCachedDreamApplicationOrFail()
  const relFilePath = path.join(relDirPath, partialFilePath)
  const absFilePath = path.join(dreamApp.projectRoot, relFilePath)
  const absDirPath = absFilePath.replace(/\/[^/]+$/, '')

  return {
    relFilePath,
    absDirPath,
    absFilePath,
  }
}
