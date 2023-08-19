export default function transformExtension(filepath: string) {
  if (process.env.DREAM_CORE_SPEC_RUN === '1' || process.env.TS_SAFE === '1') return filepath
  return filepath.replace(/\.ts$/, '.js')
}
