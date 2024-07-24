import path from 'path'
import distOrProjectRootPath from './distOrProjectRootPath'
import relativeDreamPath from './relativeDreamPath'

export default async function confPath(file?: ConfFile) {
  const relativeConfPath = await relativeDreamPath('conf')

  return distOrProjectRootPath({
    filepath: file ? path.join(relativeConfPath, file) : relativeConfPath,
  })
}

export type ConfFile = 'inflections' | 'env' | 'dream'
