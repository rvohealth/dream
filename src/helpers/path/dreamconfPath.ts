import confPath from './confPath'
import projectRootPath from './projectRootPath'

export default async function dreamconfPath() {
  return projectRootPath({ filepath: await confPath('dream') })
}
