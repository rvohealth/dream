import { DreamColumn, DreamSerializers } from '../../../src/index.js'
import { DBClass as AlternateDBClass } from '../../types/db.alternateConnection.js'
import AlternateConnectionApplicationModel from './AlternateConnectionApplicationModel.js'

// const deco = new Decorators<typeof AlternateDbConnectionUser>()

export default class AlternateDbConnectionUser extends AlternateConnectionApplicationModel {
  declare public DB: AlternateDBClass

  public override get table() {
    return 'alternate_db_connection_users' as const
  }

  public get serializers(): DreamSerializers<AlternateDbConnectionUser> {
    return {
      default: 'AlternateDbConnectionUserSerializer',
      summary: 'AlternateDbConnectionUserSummarySerializer',
    }
  }

  public id: DreamColumn<AlternateDbConnectionUser, 'id'>
  public email: DreamColumn<AlternateDbConnectionUser, 'email'>
  public name: DreamColumn<AlternateDbConnectionUser, 'name'>
  public createdAt: DreamColumn<AlternateDbConnectionUser, 'createdAt'>
  public updatedAt: DreamColumn<AlternateDbConnectionUser, 'updatedAt'>
}
