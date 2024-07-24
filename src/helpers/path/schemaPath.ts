import path from 'path'
import projectRootPath from './projectRootPath'
import relativeDreamPath from './relativeDreamPath'

export default async function schemaPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  return projectRootPath({ filepath: path.join(await relativeDreamPath('db'), 'schema.ts'), omitDirname })
}
