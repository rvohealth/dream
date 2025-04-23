import { DreamApp, DreamAppInitOptions } from '../../../src/index.js'
import dreamConfCb from '../../app/conf/dream.js'

export default async function initializeDreamApp(opts: DreamAppInitOptions = {}) {
  return await DreamApp.init(dreamConfCb, opts)
}
