// normally we wouldn't consider psychic core development,
// but given the awkward nature of the test-app folder,

import { envBool } from './envHelpers'

// it is sometimes necessary to consider it
export default function dreamOrPsychicCoreDevelopment() {
  return envBool('DREAM_CORE_DEVELOPMENT') || envBool('PSYCHIC_CORE_DEVELOPMENT')
}
