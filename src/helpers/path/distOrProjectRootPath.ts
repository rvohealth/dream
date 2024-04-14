// this function exists because when running tests, we don't want to leave typescript,
// so we avoid the dist folder. but when we run all other code, we use the dist folder

import { distPath } from './distPath'
import projectRootPath from './projectRootPath'

// to speed things up.
export default function distOrProjectRootPath({
  filepath,
  omitDirname,
}: {
  filepath: string
  omitDirname?: boolean
}) {
  if (process.env.DREAM_CORE_SPEC_RUN === '1' || process.env.TS_SAFE === '1')
    return projectRootPath({ filepath, omitDirname })
  return distPath({ filepath, omitDirname })
}
