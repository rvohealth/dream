import * as path from 'node:path'
import DreamApp from '../../dream-app/index.js'

export default function (relDirPath: string, partialFilePath: string) {
  const dreamApp = DreamApp.getOrFail()
  const relFilePath = path.join(relDirPath, partialFilePath)
  const absFilePath = path.join(dreamApp.projectRoot, relFilePath)
  const absDirPath = absFilePath.replace(/\/[^/]+$/, '')

  return {
    relFilePath,
    absDirPath,
    absFilePath,
  }
}
