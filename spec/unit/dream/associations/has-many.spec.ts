import Composition from '../../../../src/test-app/app/models/composition'
import CompositionAsset from '../../../../src/test-app/app/models/composition-asset'
import User from '../../../../src/test-app/app/models/user'

describe('Dream HasMany association', () => {
  it('builds association mapping', async () => {
    const userAssociations = User.associations.hasMany
    expect(userAssociations.length).toEqual(2)

    expect(userAssociations[0].foreignKey()).toEqual('user_id')
    expect(userAssociations[0].modelCB()).toEqual(Composition)
    expect(userAssociations[0].to).toEqual('compositions')

    expect(userAssociations[1].foreignKey()).toEqual('composition_id')
    expect(userAssociations[1].modelCB()).toEqual(CompositionAsset)
    expect(userAssociations[1].to).toEqual('composition_assets')
    expect(userAssociations[1].through!()).toEqual(Composition)

    // ensure that other model associations have not
    // accidentally overwritten this one
    expect(User.associations.belongsTo).toEqual([])
  })
})
