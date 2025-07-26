import { UpdateableProperties } from '../../../src/index.js'
import MysqlUser from '../../app/models/MysqlUser.js'

let counter = 0

export default async function createMysqlUser(attrs: UpdateableProperties<MysqlUser> = {}) {
  return await MysqlUser.create({
    email: `MysqlUser email ${++counter}`,
    name: `MysqlUser name ${counter}`,
    ...attrs,
  })
}
