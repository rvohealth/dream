export default function pathToGlobalSerializerKey(
  filepath: string,
  dirPath: string,
  exportKey: string = 'default'
) {
  const prefixPath = dirPath
  const defaultExport = filepath.replace(prefixPath, '').replace(/\.[jt]s$/, '')

  if (exportKey === 'default') {
    return defaultExport.replace(/\//g, '')
  } else {
    const namePrefixFromPath = defaultExport.replace(/[^/]+\/?$/, '').replace(/\//g, '')
    return namePrefixFromPath + exportKey.replace(new RegExp(`^${namePrefixFromPath}`), '')
  }
}
