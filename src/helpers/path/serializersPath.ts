import distOrProjectRootPath from './distOrProjectRootPath'
import dreamPath from './dreamPath'

export default async function serializersPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  return distOrProjectRootPath({ filepath: await dreamPath('serializers'), omitDirname })
}
