import Chore from "../../../../test-app/app/models/Polymorphic/Chore.js"
import PolymorphicTask from "../../../../test-app/app/models/Polymorphic/Task.js"
import PolymorphicUser from "../../../../test-app/app/models/Polymorphic/User.js"
import Workout from "../../../../test-app/app/models/Polymorphic/Workout.js"

describe('Query#preload with polymorphic through associations', () => {
  it('can load HasMany through polymorphic', async () => {
    const user = await PolymorphicUser.create({name: 'Mountain Dew'})
    const chore = await Chore.create({name: 'dishes'})
    const workout = await Workout.create({name: 'sword squats'})
    await PolymorphicTask.create({user, taskable: chore })
    await PolymorphicTask.create({user, taskable: workout })
    const userWithPreloads = await PolymorphicUser.preload('chores').findOrFail(user.id)

    expect(userWithPreloads.chores).toMatchDreamModels([chore])

  })
})