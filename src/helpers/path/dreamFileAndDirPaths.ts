import path from 'path'
import { getCachedDreamApplicationOrFail } from '../../dream-application/cache'

export default function (relDirPath: string, partialFilePath: string) {
  const dreamApp = getCachedDreamApplicationOrFail()
  const relFilePath = path.join(relDirPath, partialFilePath)
  const absDirPath = path.join(dreamApp.appRoot, relDirPath)
  const absFilePath = path.join(dreamApp.appRoot, relFilePath)

  return {
    relFilePath,
    absDirPath,
    absFilePath,
  }
}
