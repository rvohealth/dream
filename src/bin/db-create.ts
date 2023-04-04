import '../helpers/loadEnv'
import _createDb from '../helpers/db/createDb'

async function dbDrop() {
  console.log(`dropping ${process.env.DB_NAME}`)
  await _createDb()
  console.log('complete!')
  process.exit()
}

dbDrop()
