import path from 'path'
import compact from '../compact'
import dreamOrPsychicCoreDevelopment from '../dreamOrPsychicCoreDevelopment'

export default function projectRootPath({ filepath }: { filepath?: string; omitDirname?: boolean } = {}) {
  if (!process.env.APP_ROOT_PATH)
    throw `
    ATTENTION!: Must set APP_ROOT_PATH env var to your project root
  `
  return path.join(
    ...compact([process.env.APP_ROOT_PATH, dreamOrPsychicCoreDevelopment() ? '..' : null, filepath || ''])
  )
}
