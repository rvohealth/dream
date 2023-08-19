export default function shouldOmitDist() {
  return process.env.DREAM_OMIT_DIST_FOLDER === '1' || process.env.DREAM_CORE_SPEC_RUN === '1'
}
