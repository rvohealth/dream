import '../src/helpers/loadEnv'
import sspawn from '../src/helpers/sspawn'
import * as pack from '../package.json'

export default async function buildDocs() {
  console.log('generating docs for dream version: ' + pack.version + '...')
  await sspawn(`yarn typedoc src/index.ts --out docs/${pack.version}`)
  console.log('done!')
}
buildDocs()
