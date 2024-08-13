import distOrProjectRootPath from './distOrProjectRootPath'
import dreamPath from './dreamPath'

export default async function factoriesPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  return distOrProjectRootPath({ filepath: await dreamPath('factories'), omitDirname })
}
