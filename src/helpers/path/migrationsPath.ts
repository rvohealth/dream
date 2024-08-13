import path from 'path'
import distOrProjectRootPath from './distOrProjectRootPath'
import dreamPath from './dreamPath'

export default async function migrationsPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  return distOrProjectRootPath({
    filepath: path.join(await dreamPath('db'), 'migrations'),
    omitDirname,
  })
}
