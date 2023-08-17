import dotenv from 'dotenv'

const fileName = `.env${process.env.NODE_ENV === 'test' ? '.test' : ''}`
let dotenvpath: string = ''

if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
  dotenvpath =
    process.env.DREAM_CORE_SPEC_RUN === '1'
      ? __dirname + `/../../${fileName}`
      : __dirname + `/../../../${fileName}`
} else {
  dotenvpath = __dirname + `/../../../../../${fileName}`
}

dotenv.config({ path: dotenvpath })
