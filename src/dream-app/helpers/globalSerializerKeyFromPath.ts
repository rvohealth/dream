export default function globalSerializerKeyFromPath(
  filepath: string,
  dirPath: string,
  exportKey: string = 'default'
) {
  const prefixPath = dirPath
  const defaultExport = filepath
    .replace(prefixPath, '')
    .replace(/\.[jt]s$/, '')
    .replace(/^\//, '')

  if (exportKey === 'default') {
    return defaultExport
  } else {
    const namePrefixFromPath = defaultExport.replace(/[^/]+\/?$/, '')
    return namePrefixFromPath + exportKey.replace(new RegExp(`^${namePrefixFromPath.replace(/\/$/, '')}`), '')
  }
}
