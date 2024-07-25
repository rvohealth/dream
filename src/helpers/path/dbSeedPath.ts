import path from 'path'
import distOrProjectRootPath from './distOrProjectRootPath'
import relativeDreamPath from './relativeDreamPath'
import transformExtension from './transformExtension'

export default async function dbSeedPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  return distOrProjectRootPath({
    filepath: transformExtension(path.join(await relativeDreamPath('db'), 'seed.ts')),
    omitDirname,
  })
}
