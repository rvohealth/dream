export default function (filepath: string, dirPath: string) {
  const prefixPath = dirPath
  return filepath
    .replace(prefixPath, '')
    .replace(/\.[jt]s$/, '')
    .replace(/^\//, '')
}
