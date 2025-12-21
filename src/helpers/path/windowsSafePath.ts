// Create a path wrapper that converts absolute Windows paths to file:// URLs
// This is needed because kysely's FileMigrationProvider uses dynamic imports,
import * as path from 'node:path'
import convertToFileURL from './convertToFileURL.js'
import normalizeFilePath from '../../dream-app/helpers/normalizeFilePath.js'

// and on Windows, absolute paths must be file:// URLs for dynamic imports to work
const windowsSafePath = {
  ...path,
  join: (...paths: string[]) => {
    const joined = normalizeFilePath(path.join(...paths))
    return convertToFileURL(joined)
  },
  resolve: (...paths: string[]) => {
    const resolved = normalizeFilePath(path.resolve(...paths))
    return convertToFileURL(resolved)
  },
  normalize: (p: string) => {
    const normalized = normalizeFilePath(path.normalize(p))
    return convertToFileURL(normalized)
  },
}
export default windowsSafePath
