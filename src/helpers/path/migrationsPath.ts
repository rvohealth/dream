import path from 'path'
import distOrProjectRootPath from './distOrProjectRootPath'
import relativeDreamPath from './relativeDreamPath'

export default async function migrationsPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  return distOrProjectRootPath({
    filepath: path.join(await relativeDreamPath('db'), 'migrations'),
    omitDirname,
  })
}
