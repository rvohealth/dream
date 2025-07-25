import { DreamSerializer } from '../../../src/index.js'
import MysqlUser from '../models/MysqlUser.js'

export const MysqlUserSummarySerializer = (mysqlUser: MysqlUser) =>
  DreamSerializer(MysqlUser, mysqlUser).attribute('id')

export const MysqlUserSerializer = (mysqlUser: MysqlUser) =>
  MysqlUserSummarySerializer(mysqlUser).attribute('email').attribute('name')
