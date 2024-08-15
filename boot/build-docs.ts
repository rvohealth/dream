import './cli/helpers/loadAppEnvFromBoot'

import pack from '../package.json'
import sspawn from '../src/helpers/sspawn'

export default async function buildDocs() {
  console.log('generating docs for dream version: ' + pack.version + '...')
  await sspawn(`yarn typedoc src/index.ts --tsconfig ./tsconfig.build.json --out docs/${pack.version}`)
  console.log('done!')
}

void buildDocs()
