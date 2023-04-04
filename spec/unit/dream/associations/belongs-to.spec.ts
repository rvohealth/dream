import Composition from '../../../../src/test-app/app/models/composition'
import User from '../../../../src/test-app/app/models/user'

describe('Dream BelongsTo association', () => {
  it('builds association mapping', async () => {
    const compositionAssociations = Composition.associations.belongsTo
    expect(compositionAssociations.length).toEqual(1)
    expect(compositionAssociations[0].foreignKey).toEqual('user_id')
    expect(compositionAssociations[0].modelCB()).toEqual(User)
    expect(compositionAssociations[0].to).toEqual('users')
  })
})
