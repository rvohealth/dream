import path from 'path'
import projectRootPath from './projectRootPath'

export function distPath({ filepath, omitDirname }: { filepath: string; omitDirname?: boolean }) {
  return projectRootPath({ filepath: path.join('dist', filepath), omitDirname })
}
