import fs from 'fs/promises'
import sspawn from './cli/helpers/sspawn'
import { loadDreamYamlFile, shouldOmitDistFolder } from './cli/helpers/path'
import updirsToDreamRoot from './cli/helpers/updirsToDreamRoot'

export default async function syncExistingOrCreateBoilerplate() {
  console.log('checking for sync folder compatibility...')
  const yamlConf = await loadDreamYamlFile()

  try {
    await fs.statfs('./src/sync')
  } catch (_) {
    console.log('schema folder missing, adding now')
    await sspawn('mkdir ./src/sync')
  }

  try {
    await fs.statfs('./src/sync/config-cache.ts')
  } catch (_) {
    console.log('missing config cache, copying boilerplate over', process.cwd())
    await sspawn(`cp boot/boilerplate/sync/config-cache.ts src/sync/config-cache.ts`)
  }

  try {
    await fs.statfs('./src/sync/schema.ts')
  } catch (_) {
    try {
      await fs.statfs(`../../${yamlConf.schema_path}`)
      console.log('existing schema file found within project, copying to sync dir...')
      await sspawn(`cp ../../${yamlConf.schema_path} ./src/sync/schema.ts`)
    } catch (_) {
      console.log('schema file missing, adding boilerplate schema file')
      await sspawn('cp ./boot/boilerplate/sync/schema.ts ./src/sync/schema.ts')
    }
  }

  try {
    await fs.statfs('./src/sync/associations.ts')
  } catch (_) {
    try {
      await fs.statfs(`../../${yamlConf.associations_path}`)
      console.log('existing associations file found within project, copying to sync dir...')
      await sspawn(`cp ../../${yamlConf.associations_path} ./src/sync/associations.ts`)
    } catch (_) {
      console.log('associations file missing, adding boilerplate dream file')
      await sspawn('cp ./boot/boilerplate/sync/associations.ts ./src/sync/associations.ts')
    }
  }
}

syncExistingOrCreateBoilerplate()
