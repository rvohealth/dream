import { DreamApplication, DreamApplicationInitOptions } from '../../../src/index.js'
import dreamConfCb from '../../app/conf/dream.js'

export default async function initializeDreamApplication(opts: DreamApplicationInitOptions = {}) {
  return await DreamApplication.init(dreamConfCb, opts)
}
