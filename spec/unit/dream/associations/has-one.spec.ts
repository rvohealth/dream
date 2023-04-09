import Composition from '../../../../test-app/app/models/composition'
import CompositionAsset from '../../../../test-app/app/models/composition-asset'
import User from '../../../../test-app/app/models/user'

describe('Dream HasOne association', () => {
  it('builds association mapping', async () => {
    const userAssociations = User.associations.hasOne
    expect(userAssociations.length).toEqual(3)

    expect(userAssociations[0].foreignKey()).toEqual('user_id')
    expect(userAssociations[0].modelCB()).toEqual(Composition)
    expect(userAssociations[0].to).toEqual('compositions')

    expect(userAssociations[1].foreignKey()).toEqual('composition_id')
    expect(userAssociations[1].modelCB()).toEqual(CompositionAsset)
    expect(userAssociations[1].to).toEqual('composition_assets')

    // ensure that other model associations have not
    // accidentally overwritten this one
    expect(User.associations.belongsTo).toEqual([])
  })
})
