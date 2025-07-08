import { DreamSerializer } from '../../../../src/index.js'
import PolymorphicUser from '../../models/Polymorphic/User.js'

export const PolymorphicUserSerializer = (user: PolymorphicUser) =>
  DreamSerializer(PolymorphicUser, user).attribute('name').rendersMany('tasks')
