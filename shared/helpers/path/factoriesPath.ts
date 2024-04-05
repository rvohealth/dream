import distOrProjectRootPath from './distOrProjectRootPath'
import factoriesRelativePath from './factoriesRelativePath'

export default async function factoriesPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  return distOrProjectRootPath({ filepath: await factoriesRelativePath(), omitDirname })
}
