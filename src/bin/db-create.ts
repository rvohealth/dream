import '../helpers/loadEnv'
import createDb from '../helpers/db/createDb'
import { loadDbConfigYamlFile } from '../helpers/path'

async function dbCreate() {
  const dbConf = await loadDbConfigYamlFile()
  console.log(`creating ${process.env[dbConf.name]}`)
  await createDb()
  console.log('complete!')
  process.exit()
}

dbCreate()
