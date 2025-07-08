import { Decorators } from '../../../../src/index.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import { PolymorphicUserSerializer } from '../../serializers/Polymorphic/UserSerializer.js'
import ApplicationModel from '../ApplicationModel.js'
import Chore from './Chore.js'
import PolymorphicTask from './Task.js'

const deco = new Decorators<typeof PolymorphicUser>()

export default class PolymorphicUser extends ApplicationModel {
  public override get table() {
    return 'polymorphic_users' as const
  }

  public get serializers() {
    return {
      default: PolymorphicUserSerializer,
    }
  }

  public id: DreamColumn<PolymorphicUser, 'id'>
  public name: DreamColumn<PolymorphicUser, 'name'>
  public createdAt: DreamColumn<PolymorphicUser, 'createdAt'>
  public updatedAt: DreamColumn<PolymorphicUser, 'updatedAt'>

  @deco.HasMany('Polymorphic/Task')
  public tasks: PolymorphicTask[]

  @deco.HasMany('Polymorphic/Chore', { through: 'tasks', source: 'taskable' })
  public chores: Chore[]

  @deco.HasOne('Polymorphic/Chore', { through: 'tasks', source: 'taskable', and: { name: 'favorite' } })
  public favoriteChore: Chore | null
}
