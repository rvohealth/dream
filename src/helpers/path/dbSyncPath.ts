import path from 'path'
import dreamPath from './dreamPath'
import projectRootPath from './projectRootPath'

export default async function dbSyncPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  return projectRootPath({ filepath: path.join(await dreamPath('db'), 'sync.ts'), omitDirname })
}
