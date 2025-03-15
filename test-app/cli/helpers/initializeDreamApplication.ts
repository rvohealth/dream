import { DreamApplication, DreamApplicationInitOptions } from '../../../src.js'
import dreamConfCb from '../../app/conf/dream.js'

export default async function initializeDreamApplication(opts: DreamApplicationInitOptions = {}) {
  return await DreamApplication.init(dreamConfCb, opts)
}
