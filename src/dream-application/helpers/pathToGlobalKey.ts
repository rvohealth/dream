export default function pathToGlobalKey(
  filepath: string,
  startingRegex: RegExp,
  exportKey: string = 'default'
) {
  const defaultExport = filepath.replace(startingRegex, '').replace(/\.[jt]s$/, '')
  if (exportKey === 'default') {
    return defaultExport
  } else {
    const arr = defaultExport.split('/')
    arr.pop()
    return arr.join('/') + exportKey
  }
}
