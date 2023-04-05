import Composition from '../../../../src/test-app/app/models/composition'
import User from '../../../../src/test-app/app/models/user'

describe('Dream HasOne association', () => {
  it('builds association mapping', async () => {
    const userAssociations = User.associations.hasOne
    expect(userAssociations.length).toEqual(1)
    expect(userAssociations[0].foreignKey()).toEqual('user_id')
    expect(userAssociations[0].modelCB()).toEqual(Composition)
    expect(userAssociations[0].to).toEqual('compositions')

    // ensure that other model associations have not
    // accidentally overwritten this one
    expect(User.associations.belongsTo).toEqual([])
  })
})
