import distOrProjectRootPath from './distOrProjectRootPath'
import dreamPath from './dreamPath'

export default async function unitSpecsPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  return distOrProjectRootPath({ filepath: await dreamPath('uspec'), omitDirname })
}
