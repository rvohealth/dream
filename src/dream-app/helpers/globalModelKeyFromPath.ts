import normalizeFilePath from './normalizeFilePath.js'

export default function (filepath: string, dirPath: string) {
  const normalizedDirPath = normalizeFilePath(dirPath)
  const normalizedFilepath = normalizeFilePath(filepath)
  const prefixPath = normalizedDirPath
  return normalizedFilepath
    .replace(prefixPath, '')
    .replace(/\.[jt]s$/, '')
    .replace(/^\//, '')
}
