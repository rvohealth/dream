import Chore from '../../../../test-app/app/models/Polymorphic/Chore.js'
import PolymorphicMetaUser from '../../../../test-app/app/models/Polymorphic/MetaUser.js'
import PolymorphicTask from '../../../../test-app/app/models/Polymorphic/Task.js'
import PolymorphicUser from '../../../../test-app/app/models/Polymorphic/User.js'
import PolymorphicUserMetaUser from '../../../../test-app/app/models/Polymorphic/UserMetaUser.js'
import Workout from '../../../../test-app/app/models/Polymorphic/Workout.js'

describe('Query#preload with polymorphic through associations', () => {
  it('can load HasMany through polymorphic', async () => {
    const user = await PolymorphicUser.create({ name: 'Mountain Dew' })
    const chore = await Chore.create({ name: 'dishes' })
    const workout = await Workout.create({ name: 'sword squats' })
    await PolymorphicTask.create({ user, taskable: chore })
    await PolymorphicTask.create({ user, taskable: workout })

    const userWithPreloads = await PolymorphicUser.preload('chores').findOrFail(user.id)

    expect(userWithPreloads.chores).toMatchDreamModels([chore])
  })

  context('through association on another model to polymorphic association on this model', () => {
    it('can load HasMany through polymorphic', async () => {
      const user = await PolymorphicUser.create({ name: 'Mountain Dew' })
      const metaUser = await PolymorphicMetaUser.create({ name: 'Meta Do' })
      await PolymorphicUserMetaUser.create({ polymorphicUser: user, polymorphicMetaUser: metaUser })

      const chore = await Chore.create({ name: 'dishes' })
      const workout = await Workout.create({ name: 'sword squats' })
      await PolymorphicTask.create({ user, taskable: chore })
      await PolymorphicTask.create({ user, taskable: workout })

      const metaUserWithPreloads = await PolymorphicMetaUser.preload('chores').findOrFail(metaUser.id)

      expect(metaUserWithPreloads.chores).toMatchDreamModels([chore])
    })
  })
})
