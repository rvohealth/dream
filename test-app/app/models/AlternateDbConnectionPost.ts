import Decorators from '../../../src/decorators/Decorators.js'
import { DreamColumn, DreamSerializers } from '../../../src/types/dream.js'
import AlternateConnectionApplicationModel from './AlternateConnectionApplicationModel.js'
import AlternateDbConnectionUser from './AlternateDbConnectionUser.js'

const deco = new Decorators<typeof AlternateDbConnectionPost>()

export default class AlternateDbConnectionPost extends AlternateConnectionApplicationModel {
  public override get table() {
    return 'alternate_db_connection_posts' as const
  }

  public get serializers(): DreamSerializers<AlternateDbConnectionPost> {
    return {
      default: 'AlternateDbConnectionPostSerializer',
      summary: 'AlternateDbConnectionPostSummarySerializer',
    }
  }

  public id: DreamColumn<AlternateDbConnectionPost, 'id'>
  public body: DreamColumn<AlternateDbConnectionPost, 'body'>
  public createdAt: DreamColumn<AlternateDbConnectionPost, 'createdAt'>
  public updatedAt: DreamColumn<AlternateDbConnectionPost, 'updatedAt'>

  @deco.BelongsTo('AlternateDbConnectionUser')
  public alternateDbConnectionUser: AlternateDbConnectionUser
  public alternateDbConnectionUserId: DreamColumn<AlternateDbConnectionPost, 'alternateDbConnectionUserId'>
}
