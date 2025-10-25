import { DreamColumn, DreamSerializers } from '../../../src/types/dream.js'
import MysqlApplicationModel from './MysqlApplicationModel.js'

// const deco = new Decorators<typeof MysqlUser>()

export default class MysqlUser extends MysqlApplicationModel {
  public override get table() {
    return 'mysql_users' as const
  }

  public get serializers(): DreamSerializers<MysqlUser> {
    return {
      default: 'MysqlUserSerializer',
      summary: 'MysqlUserSummarySerializer',
    }
  }

  public id: DreamColumn<MysqlUser, 'id'>
  public email: DreamColumn<MysqlUser, 'email'>
  public name: DreamColumn<MysqlUser, 'name'>
  public createdAt: DreamColumn<MysqlUser, 'createdAt'>
  public updatedAt: DreamColumn<MysqlUser, 'updatedAt'>
}
