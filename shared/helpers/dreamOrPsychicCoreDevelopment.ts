// normally we wouldn't consider psychic core development,
// but given the awkward nature of the test-app folder,
// it is sometimes necessary to consider it
export default function dreamOrPsychicCoreDevelopment() {
  return process.env.DREAM_CORE_DEVELOPMENT === '1' || process.env.PSYCHIC_CORE_DEVELOPMENT === '1'
}
