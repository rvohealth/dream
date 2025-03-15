import * as path from 'path'
import DreamApplication from '../../dream-application/index.js.js'

export default function (relDirPath: string, partialFilePath: string) {
  const dreamApp = DreamApplication.getOrFail()
  const relFilePath = path.join(relDirPath, partialFilePath)
  const absFilePath = path.join(dreamApp.projectRoot, relFilePath)
  const absDirPath = absFilePath.replace(/\/[^/]+$/, '')

  return {
    relFilePath,
    absDirPath,
    absFilePath,
  }
}
