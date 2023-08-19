export default function shouldOmitDistFolder() {
  return (
    process.env.DREAM_OMIT_DIST_FOLDER === '1' ||
    (process.env.DREAM_CORE_DEVELOPMENT === '1' && process.env.DREAM_CORE_SPEC_RUN === '1')
  )
}
