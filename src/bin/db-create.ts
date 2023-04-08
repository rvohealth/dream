import '../helpers/loadEnv'
import createDb from '../helpers/db/createDb'

async function dbCreate() {
  console.log(`creating ${process.env.DB_NAME}`)
  await createDb()
  console.log('complete!')
  process.exit()
}

dbCreate()
