import Decorators from '../../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'
import PolymorphicMetaUser from './MetaUser.js'
import PolymorphicUser from './User.js'

const deco = new Decorators<typeof PolymorphicUserMetaUser>()

export default class PolymorphicUserMetaUser extends ApplicationModel {
  public override get table() {
    return 'polymorphic_user_meta_users' as const
  }

  public id: DreamColumn<PolymorphicUserMetaUser, 'id'>
  public createdAt: DreamColumn<PolymorphicUserMetaUser, 'createdAt'>
  public updatedAt: DreamColumn<PolymorphicUserMetaUser, 'updatedAt'>

  @deco.BelongsTo('Polymorphic/User')
  public polymorphicUser: PolymorphicUser
  public polymorphicUserId: DreamColumn<PolymorphicUserMetaUser, 'polymorphicUserId'>

  @deco.BelongsTo('Polymorphic/MetaUser')
  public polymorphicMetaUser: PolymorphicMetaUser
  public polymorphicMetaUserId: DreamColumn<PolymorphicUserMetaUser, 'polymorphicMetaUserId'>
}
