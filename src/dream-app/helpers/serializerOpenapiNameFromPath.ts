export default function serializerOpenapiNameFromPath(
  filepath: string,
  dirPath: string,
  exportKey: string = 'default'
) {
  return _serializerOpenapiNameFromPath(filepath, dirPath, exportKey).replace(/Serializer$/, '')
}

function _serializerOpenapiNameFromPath(filepath: string, dirPath: string, exportKey: string = 'default') {
  if (exportKey === 'default') {
    const defaultExport = filepath
      .replace(dirPath, '')
      .replace(/\.[jt]s$/, '')
      .replace(/\//g, '')

    return defaultExport
  } else {
    return exportKey
  }
}
