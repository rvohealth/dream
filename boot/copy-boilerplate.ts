import * as fs from 'fs/promises'
import sspawn from '../src/helpers/sspawn'
import { loadDreamYamlFile } from '../src/helpers/path'

export default async function copyBoilerplate() {
  console.log('checking for sync folder compatibility...')
  const yamlConf = await loadDreamYamlFile()

  try {
    await fs.statfs('./src/sync')
  } catch (_) {
    console.log('schema folder missing, adding now')
    await sspawn('mkdir ./src/sync')
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
    await fs.statfs('./src/sync/dream.ts')
  } catch (_) {
    try {
      await fs.statfs(`../../${yamlConf.dream_config_path}`)
      console.log('existing dream file found within project, copying to sync dir...')
      await sspawn(`cp ../../${yamlConf.dream_config_path} ./src/sync/dream.ts`)
    } catch (_) {
      console.log('dream file missing, adding boilerplate dream file')
      await sspawn('cp ./boot/boilerplate/sync/dream.ts ./src/sync/dream.ts')
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

copyBoilerplate()
