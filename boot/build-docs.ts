import pack from '../package.json'
import { Dreamconf } from '../src'
import sspawn from '../src/helpers/sspawn'
import './cli/helpers/loadAppEnvFromBoot'

export default async function buildDocs() {
  await Dreamconf.configure()
  console.log('generating docs for dream version: ' + pack.version + '...')
  await sspawn(`yarn typedoc src/index.ts --tsconfig ./tsconfig.build.json --out docs/${pack.version}`)
  console.log('done!')
}

void buildDocs()
