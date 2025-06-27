import { UpdateableProperties } from '@rvoh/dream'
import PolymorphicTask from '../../../app/models/Polymorphic/Task.js'
import createPolymorphicUser from './UserFactory.js'

export default async function createPolymorphicTask(attrs: UpdateableProperties<PolymorphicTask> = {}) {
  return await PolymorphicTask.create({
    polymorphicUser: attrs.polymorphicUser ? null : await createPolymorphicUser(),
    ...attrs,
  })
}
