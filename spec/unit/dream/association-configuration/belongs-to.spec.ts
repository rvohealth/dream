import Composition from '../../../../test-app/app/models/Composition'
import User from '../../../../test-app/app/models/User'

describe('Dream BelongsTo association', () => {
  it('builds association mapping', async () => {
    const compositionAssociations = Composition.associations.belongsTo
    expect(compositionAssociations.length).toEqual(1)
    expect(compositionAssociations[0].foreignKey()).toEqual('userId')
    expect(compositionAssociations[0].modelCB()).toEqual(User)
  })
})
