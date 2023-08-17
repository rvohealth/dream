import dotenv from 'dotenv'

if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
  const dotenvpath =
    process.env.NODE_ENV === 'test' ? __dirname + '/../../.env.test' : __dirname + '/../../../.env'
  console.log('DEBUG 1', __dirname)
  dotenv.config({ path: dotenvpath })
} else {
  console.log('DEBUG 2', __dirname)
  dotenv.config({
    path: process.env.NODE_ENV === 'test' ? '../../../../../.env.test' : '../../../../../.env',
  })
}
