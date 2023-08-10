import '../helpers/loadEnv'
import _dropDb from '../helpers/db/dropDb'
import { loadDbConfigYamlFile } from '../helpers/path'

async function dbDrop() {
  const dbConf = await loadDbConfigYamlFile()
  console.log(`dropping ${process.env[dbConf.name]}`)
  await _dropDb()
  console.log('complete!')
  process.exit()
}

dbDrop()
