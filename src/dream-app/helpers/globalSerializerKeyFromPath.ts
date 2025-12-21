export default function globalSerializerKeyFromPath(
  filepath: string,
  dirPath: string,
  exportKey: string = 'default'
) {
  const normalizedDirPath = dirPath.replace(/\\/g, '/')
  const normalizedFilepath = filepath.replace(/\\/g, '/')
  const prefixPath = normalizedDirPath
  const defaultExport = normalizedFilepath
    .replace(prefixPath, '')
    .replace(/\.[jt]s$/, '')
    .replace(/^\//, '')
  if (exportKey === 'default') {
    return defaultExport
  } else {
    const namePrefixFromPath = defaultExport.replace(/[^/]+\/?$/, '')
    return namePrefixFromPath + exportKey.replace(new RegExp(`^${namePrefixFromPath.replace(/\//g, '')}`), '')
  }
}
