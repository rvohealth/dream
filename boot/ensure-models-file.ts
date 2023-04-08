import * as fs from 'fs/promises'
import sspawn from '../src/helpers/sspawn'

export default async function ensureModelsFile() {
  console.log('checking for models file...')
  try {
    await fs.statfs('./src/sync/models.ts')
  } catch (_) {
    console.log('models file missing, adding boilerplate models file')
    await sspawn('cp ./boot/boilerplate/sync/models.ts ./src/sync/models.ts')
    console.log('done!')
  }
}

ensureModelsFile()
