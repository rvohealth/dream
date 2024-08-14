export default function pathToGlobalKey(filepath: string, dirPath: string) {
  const prefixPath = dirPath.replace(/[^/]+\/?$/, '')
  return filepath.replace(prefixPath, '').replace(/\.[jt]s$/, '')
}
