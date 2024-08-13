import path from 'path'
import distOrProjectRootPath from './distOrProjectRootPath'
import dreamPath from './dreamPath'

export default async function confPath(file?: ConfFile) {
  const relativeConfPath = await dreamPath('conf')

  return distOrProjectRootPath({
    filepath: file ? path.join(relativeConfPath, file) : relativeConfPath,
  })
}

export type ConfFile = 'inflections' | 'env' | 'dream'
