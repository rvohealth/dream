import envPath from './envPath'
import importFile from './importFile'
import { EnvOpts } from './types'

export default async function loadEnvConf() {
  return (await importFile(await envPath())).default as EnvOpts
}
