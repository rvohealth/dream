import { Decorators } from '../../../../src/index.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'
import Chore from './Chore.js'
import PolymorphicLocalizedText from './LocalizedText.js'
import PolymorphicUser from './User.js'
import PolymorphicUserMetaUser from './UserMetaUser.js'

const deco = new Decorators<typeof PolymorphicMetaUser>()

export default class PolymorphicMetaUser extends ApplicationModel {
  public override get table() {
    return 'polymorphic_meta_users' as const
  }

  public id: DreamColumn<PolymorphicMetaUser, 'id'>
  public name: DreamColumn<PolymorphicMetaUser, 'name'>
  public createdAt: DreamColumn<PolymorphicMetaUser, 'createdAt'>
  public updatedAt: DreamColumn<PolymorphicMetaUser, 'updatedAt'>

  @deco.HasMany('Polymorphic/UserMetaUser')
  public userMetaUsers: PolymorphicUserMetaUser

  @deco.HasMany('Polymorphic/User', { through: 'userMetaUsers' })
  public polymorphicUser: PolymorphicUser

  @deco.HasMany('Polymorphic/Chore', { through: 'polymorphicUser' })
  public chores: Chore[]

  @deco.HasMany('Polymorphic/LocalizedText', { through: 'chores', source: 'localizedTexts' })
  public choreLocalizedTexts: PolymorphicLocalizedText[]
}
