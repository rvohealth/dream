import convertToFileURL from '../../../../src/helpers/path/convertToFileURL.js'

export default async function importDefault<ReturnType = unknown>(path: string) {
  const importPath = convertToFileURL(path)
  return ((await import(importPath)) as { default: ReturnType }).default
}
