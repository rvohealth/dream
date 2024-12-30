// normally we wouldn't consider psychic core development,
// but given the awkward nature of the test-app folder,

import EnvInternal from './EnvInternal'

// it is sometimes necessary to consider it
export default function dreamOrPsychicCoreDevelopment() {
  return EnvInternal.boolean('DREAM_CORE_DEVELOPMENT') || EnvInternal.boolean('PSYCHIC_CORE_DEVELOPMENT')
}
