import distOrProjectRootPath from './distOrProjectRootPath'
import relativeDreamPath from './relativeDreamPath'

export default async function modelsPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  return distOrProjectRootPath({ filepath: await relativeDreamPath('models'), omitDirname })
}
