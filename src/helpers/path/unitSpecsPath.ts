import distOrProjectRootPath from './distOrProjectRootPath'
import relativeDreamPath from './relativeDreamPath'

export default async function unitSpecsPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  return distOrProjectRootPath({ filepath: await relativeDreamPath('uspec'), omitDirname })
}
