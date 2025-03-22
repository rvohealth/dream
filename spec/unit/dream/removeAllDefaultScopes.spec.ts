import { Query } from '../../../src/index.js'
import { IdType } from '../../../src/types/dream.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream#removeAllDefaultScopes', () => {
  let user: User
  let pet: Pet
  let petId: IdType

  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    pet = await Pet.create({ user })
    petId = pet.id
  })

  it('calls Query#removeAllDefaultScopes', async () => {
    const spy = vi.spyOn(Query.prototype, 'removeAllDefaultScopes')
    await Pet.removeAllDefaultScopes().find(petId)
    expect(spy).toHaveBeenCalled()
  })

  context('within a transaction', () => {
    it('calls Query#removeAllDefaultScopes', async () => {
      const spy = vi.spyOn(Query.prototype, 'removeAllDefaultScopes')

      await ApplicationModel.transaction(async txn => {
        await Pet.txn(txn).removeAllDefaultScopes().find(petId)
      })

      expect(spy).toHaveBeenCalled()
    })
  })
})
