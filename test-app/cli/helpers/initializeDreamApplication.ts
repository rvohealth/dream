import { DreamApplication, DreamApplicationInitOptions } from '../../../src'
import dreamConfCb from '../../app/conf/dream'

export default async function initializeDreamApplication(opts: DreamApplicationInitOptions = {}) {
  return await DreamApplication.init(dreamConfCb, opts)
}
