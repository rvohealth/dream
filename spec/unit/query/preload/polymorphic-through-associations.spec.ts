import CannotAssociateThroughMultiplePolymorphics from '../../../../src/errors/associations/CannotAssociateThroughMultiplePolymorphics.js'
import Chore from '../../../../test-app/app/models/Polymorphic/Chore.js'
import PolymorphicLocalizedText from '../../../../test-app/app/models/Polymorphic/LocalizedText.js'
import PolymorphicMetaUser from '../../../../test-app/app/models/Polymorphic/MetaUser.js'
import PolymorphicTask from '../../../../test-app/app/models/Polymorphic/Task.js'
import PolymorphicUser from '../../../../test-app/app/models/Polymorphic/User.js'
import PolymorphicUserMetaUser from '../../../../test-app/app/models/Polymorphic/UserMetaUser.js'
import Workout from '../../../../test-app/app/models/Polymorphic/Workout.js'

describe(
  'Query#preload through a BelongsTo polymorphic association ' +
    '(harder than through a HasOne/Many polymorphic association because the ' +
    'HasOne/Many direction includes a reference to a particular table; when ' +
    'going from the BelongsTo direction, the association references more than' +
    'one table; the trick is to use the target class defined on the `through` ' +
    'association to collapse the BelongsTo association to a single table)',
  () => {
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

        await Chore.create({ name: 'dishes' })
        const chore = await Chore.create({ name: 'sweep' })
        const workout = await Workout.create({ name: 'sword squats' })
        await PolymorphicTask.create({ user, taskable: chore })
        await PolymorphicTask.create({ user, taskable: workout })

        const metaUserWithPreloads = await PolymorphicMetaUser.preload('chores', {
          and: { name: 'sweep' },
        }).findOrFail(metaUser.id)

        expect(metaUserWithPreloads.chores).toMatchDreamModels([chore])
      })
    })

    context('multiple polymorphic through associations', () => {
      it('can load HasMany through polymorphic', async () => {
        const user = await PolymorphicUser.create({ name: 'Mountain Dew' })
        const metaUser = await PolymorphicMetaUser.create({ name: 'Meta Do' })
        await PolymorphicUserMetaUser.create({ polymorphicUser: user, polymorphicMetaUser: metaUser })

        const chore = await Chore.create({ name: 'dishes' })
        const workout = await Workout.create({ name: 'sword squats' })
        await PolymorphicTask.create({ user, taskable: chore })
        await PolymorphicTask.create({ user, taskable: workout })

        await PolymorphicLocalizedText.create({
          localizable: chore,
          locale: 'en-US',
          title: 'My chore task',
        })
        await PolymorphicLocalizedText.create({
          localizable: workout,
          locale: 'en-US',
          title: 'My workout task',
        })

        await expect(
          PolymorphicMetaUser.preload('choreLocalizedTexts').findOrFail(metaUser.id)
        ).rejects.toThrow(CannotAssociateThroughMultiplePolymorphics)
      })
    })
  }
)
