import { Query } from '../../../src'
import { IdType } from '../../../src/dream/types'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Pet from '../../../test-app/app/models/Pet'
import User from '../../../test-app/app/models/User'

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
    const spy = jest.spyOn(Query.prototype, 'removeAllDefaultScopes')
    await Pet.removeAllDefaultScopes().find(petId)
    expect(spy).toHaveBeenCalled()
  })

  context('within a transaction', () => {
    it('calls Query#removeAllDefaultScopes', async () => {
      const spy = jest.spyOn(Query.prototype, 'removeAllDefaultScopes')

      await ApplicationModel.transaction(async txn => {
        await Pet.txn(txn).removeAllDefaultScopes().find(petId)
      })

      expect(spy).toHaveBeenCalled()
    })
  })
})
