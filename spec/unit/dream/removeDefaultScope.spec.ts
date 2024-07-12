import { Query } from '../../../src'
import { IdType } from '../../../src/dream/types'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Pet from '../../../test-app/app/models/Pet'
import User from '../../../test-app/app/models/User'

describe('Dream#removeDefaultScope', () => {
  let user: User
  let pet: Pet
  let petId: IdType

  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    pet = await Pet.create({ user })
    petId = pet.id
  })

  it('calls Query#removeDefaultScope, passing scope name', async () => {
    const spy = jest.spyOn(Query.prototype, 'removeDefaultScope')
    await Pet.removeDefaultScope('dream:SoftDelete').find(petId)
    expect(spy).toHaveBeenCalledWith('dream:SoftDelete')
  })

  context('within a transaction', () => {
    it('calls Query#removeDefaultScope, passing scope name', async () => {
      const spy = jest.spyOn(Query.prototype, 'removeDefaultScope')

      await ApplicationModel.transaction(async txn => {
        await Pet.txn(txn).removeDefaultScope('dream:SoftDelete').find(petId)
      })

      expect(spy).toHaveBeenCalledWith('dream:SoftDelete')
    })
  })
})
