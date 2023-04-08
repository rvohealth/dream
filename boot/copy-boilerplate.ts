import * as fs from 'fs/promises'
import sspawn from '../src/helpers/sspawn'

export default async function copyBoilerplate() {
  console.log('checking for sync folder compatibility...')

  try {
    await fs.statfs('./src/sync')
  } catch (_) {
    console.log('schema folder missing, adding now')
    await sspawn('mkdir ./src/sync')
  }

  try {
    await fs.statfs('./src/sync/schema.ts')
  } catch (_) {
    console.log('schema file missing, adding boilerplate schema file')
    await sspawn('cp ./boot/boilerplate/sync/schema.ts ./src/sync/schema.ts')
  }

  try {
    await fs.statfs('./src/sync/dream.ts')
  } catch (_) {
    console.log('dream file missing, adding boilerplate dream file')
    await sspawn('cp ./boot/boilerplate/sync/dream.ts ./src/sync/dream.ts')
  }

  try {
    await fs.statfs('./src/sync/models.ts')
  } catch (_) {
    console.log('models file missing, adding boilerplate models file')
    await sspawn('cp ./boot/boilerplate/sync/models.ts ./src/sync/models.ts')
  }
}

copyBoilerplate()
