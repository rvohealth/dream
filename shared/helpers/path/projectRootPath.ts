import path from 'path'
import compact from '../compact'

export default function projectRootPath({
  filepath,
  omitDirname,
}: { filepath?: string; omitDirname?: boolean } = {}) {
  if (!process.env.APP_ROOT_PATH)
    throw `
    ATTENTION!: Must set APP_ROOT_PATH env var to your project root
  `
  return path.join(
    ...compact([
      process.env.APP_ROOT_PATH!,
      process.env.DREAM_CORE_DEVELOPMENT === '1' ? '..' : null,
      filepath || '',
    ])
  )
}
