import convertToFileURL from '../../../../src/helpers/path/convertToFileURL.js'

export default async function importAll<ReturnType = unknown>(path: string) {
  const importPath = convertToFileURL(path)
  return (await import(importPath)) as ReturnType
}
