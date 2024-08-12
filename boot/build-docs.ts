import './cli/helpers/loadAppEnvFromBoot'

import pack from '../package.json'
import sspawn from '../src/helpers/sspawn'
import { initializeDreamApplication } from '../test-app/app/conf/dream'

export default async function buildDocs() {
  await initializeDreamApplication()
  console.log('generating docs for dream version: ' + pack.version + '...')
  await sspawn(`yarn typedoc src/index.ts --tsconfig ./tsconfig.build.json --out docs/${pack.version}`)
  console.log('done!')
}

void buildDocs()
