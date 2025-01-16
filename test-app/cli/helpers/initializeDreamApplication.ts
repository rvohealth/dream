import { DreamApplication } from '../../../src'
import dreamConfCb from '../../app/conf/dream'

export default async function initializeDreamApplication({
  bypassModelIntegrityCheck = false,
}: { bypassModelIntegrityCheck?: boolean } = {}) {
  return await DreamApplication.init(dreamConfCb, { bypassModelIntegrityCheck })
}
