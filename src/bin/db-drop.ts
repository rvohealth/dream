import '../helpers/loadEnv'
import _dropDb from '../helpers/db/dropDb'

async function dbDrop() {
  console.log(`dropping ${process.env.DB_NAME}`)
  await _dropDb()
  console.log('complete!')
  process.exit()
}

dbDrop()
