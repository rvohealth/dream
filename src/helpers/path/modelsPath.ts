import distOrProjectRootPath from './distOrProjectRootPath'
import dreamPath from './dreamPath'

export default async function modelsPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  return distOrProjectRootPath({ filepath: await dreamPath('models'), omitDirname })
}
