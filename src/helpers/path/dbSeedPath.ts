import path from 'path'
import distOrProjectRootPath from './distOrProjectRootPath'
import dreamPath from './dreamPath'
import transformExtension from './transformExtension'

export default async function dbSeedPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  return distOrProjectRootPath({
    filepath: transformExtension(path.join(await dreamPath('db'), 'seed.ts')),
    omitDirname,
  })
}
