export default function (filepath: string, dirPath: string) {
  const normalizedDirPath = dirPath.replace(/\\/g, '/')
  const normalizedFilepath = filepath.replace(/\\/g, '/')
  const prefixPath = normalizedDirPath
  return normalizedFilepath
    .replace(prefixPath, '')
    .replace(/\.[jt]s$/, '')
    .replace(/^\//, '')
}
