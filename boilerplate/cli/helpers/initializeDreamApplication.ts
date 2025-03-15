import { DreamApplication } from '@rvoh/dream'
import dreamConfCb from '../../app/conf/dream.js'

export default async function initializeDreamApplication() {
  return await DreamApplication.init(dreamConfCb)
}
