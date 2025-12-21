// Create a path wrapper that converts absolute Windows paths to file:// URLs
// This is needed because kysely's FileMigrationProvider uses dynamic imports,
import * as path from 'node:path'
import convertToFileURL from './convertToFileURL.js'
// and on Windows, absolute paths must be file:// URLs for dynamic imports to work
const windowsSafePath = {
  ...path,
  join: (...paths: string[]) => {
    const joined = path.join(...paths).replace(/\\/g, '/')
    return convertToFileURL(joined)
  },
  resolve: (...paths: string[]) => {
    const resolved = path.resolve(...paths).replace(/\\/g, '/')
    return convertToFileURL(resolved)
  },
  normalize: (p: string) => {
    const normalized = path.normalize(p).replace(/\\/g, '/')
    return convertToFileURL(normalized)
  },
}
export default windowsSafePath
