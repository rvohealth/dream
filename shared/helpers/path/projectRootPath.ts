import path from 'path'
import compact from '../compact'
import shouldOmitDistFolder from './shouldOmitDistFolder'

export default function projectRootPath({
  filepath,
  omitDirname,
}: { filepath?: string; omitDirname?: boolean } = {}) {
  const dirname = omitDirname ? undefined : __dirname

  if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
    return shouldOmitDistFolder()
      ? path.join(...compact([dirname, '..', '..', '..', filepath]))
      : path.join(...compact([dirname, '..', '..', '..', '..', filepath]))
  } else {
    console.log(
      shouldOmitDistFolder(),
      path.join(...compact([dirname, '..', '..', '..', '..', '..', filepath]))
    )
    return shouldOmitDistFolder()
      ? path.join(...compact([dirname, '..', '..', '..', '..', '..', filepath]))
      : path.join(...compact([dirname, '..', '..', '..', '..', '..', '..', filepath]))
  }
}
