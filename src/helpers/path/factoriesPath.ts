import distOrProjectRootPath from './distOrProjectRootPath'
import relativeDreamPath from './relativeDreamPath'

export default async function factoriesPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  return distOrProjectRootPath({ filepath: await relativeDreamPath('factories'), omitDirname })
}
