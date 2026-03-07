import * as path from 'node:path'
import normalizeFilePath from './normalizeFilePath.js'

export default function (filepath: string, dirPath: string) {
  const normalizedDirPath = normalizeFilePath(path.resolve(dirPath))
  const normalizedFilepath = normalizeFilePath(path.resolve(filepath))
  const prefixPath = normalizedDirPath
  return normalizedFilepath
    .replace(prefixPath, '')
    .replace(/\.[jt]s$/, '')
    .replace(/^\//, '')
}
