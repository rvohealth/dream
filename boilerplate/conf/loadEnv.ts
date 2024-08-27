import dotenv from 'dotenv'

const filePath = `./.env${process.env.NODE_ENV === 'test' ? '.test' : ''}`
dotenv.config({ path: filePath })
