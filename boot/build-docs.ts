import './cli/helpers/loadAppEnvFromBoot'
import sspawn from '../src/helpers/sspawn'
import pack from '../package.json'

export default async function buildDocs() {
  console.log('generating docs for dream version: ' + pack.version + '...')
  await sspawn(`yarn typedoc src/index.ts --tsconfig ./tsconfig.build.json --out docs/${pack.version}`)
  console.log('done!')
}

void buildDocs()
