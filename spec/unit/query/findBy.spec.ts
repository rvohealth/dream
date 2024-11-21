import CannotPassUndefinedAsAValueToAWhereClause from '../../../src/exceptions/CannotPassUndefinedAsAValueToAWhereClause'
import ops from '../../../src/ops'
import User from '../../../test-app/app/models/User'

describe('Query#findBy', () => {
  let user: User
  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred o' })
  })

  it('applies a where query and grabs first result', async () => {
    const reloadedUser = await User.query().findBy({ email: 'fred@frewd' })
    expect(reloadedUser).toMatchDreamModel(user)
  })

  context('when passed undefined as a value', () => {
    it('raises an exception', async () => {
      await expect(async () => await User.query().findBy({ email: undefined })).rejects.toThrowError(
        CannotPassUndefinedAsAValueToAWhereClause
      )
    })
  })

  context('similarity operator is used', () => {
    it('filters results on similarity match', async () => {
      expect(await User.query().findBy({ name: ops.similarity('fredo') })).toMatchDreamModel(user)
      expect(await User.query().findBy({ name: ops.similarity('nonmatch') })).toBeNull()
    })
  })
})
