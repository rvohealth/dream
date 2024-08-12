import path from 'path'
import compact from '../compact'
import dreamOrPsychicCoreDevelopment from '../dreamOrPsychicCoreDevelopment'
import { getCachedDreamApplicationOrFail } from '../../dream-application/cache'

export default function projectRootPath({ filepath }: { filepath?: string; omitDirname?: boolean } = {}) {
  const dreamApp = getCachedDreamApplicationOrFail()
  return path.join(
    ...compact([dreamApp.appRoot, dreamOrPsychicCoreDevelopment() ? '..' : null, filepath || ''])
  )
}
