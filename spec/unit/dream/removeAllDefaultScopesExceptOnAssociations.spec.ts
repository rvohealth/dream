import { Query } from '../../../src'
import { IdType } from '../../../src/dream/types'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Pet from '../../../test-app/app/models/Pet'
import User from '../../../test-app/app/models/User'

describe('Dream#removeAllDefaultScopesExceptOnAssociations', () => {
  let user: User
  let pet: Pet
  let petId: IdType

  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    pet = await Pet.create({ user })
    petId = pet.id
  })

  it('calls Query#removeAllDefaultScopesExceptOnAssociations', async () => {
    const spy = jest.spyOn(Query.prototype, 'removeAllDefaultScopesExceptOnAssociations')
    await Pet.removeAllDefaultScopesExceptOnAssociations().find(petId)
    expect(spy).toHaveBeenCalled()
  })

  context('within a transaction', () => {
    it('calls Query#removeAllDefaultScopesExceptOnAssociations', async () => {
      const spy = jest.spyOn(Query.prototype, 'removeAllDefaultScopesExceptOnAssociations')

      await ApplicationModel.transaction(async txn => {
        await Pet.txn(txn).removeAllDefaultScopesExceptOnAssociations().find(petId)
      })

      expect(spy).toHaveBeenCalled()
    })
  })
})
