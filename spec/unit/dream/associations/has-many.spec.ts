import Balloon from '../../../../test-app/app/models/balloon'
import Composition from '../../../../test-app/app/models/composition'
import CompositionAsset from '../../../../test-app/app/models/composition-asset'
import CompositionAssetAudit from '../../../../test-app/app/models/composition-asset-audit'
import User from '../../../../test-app/app/models/user'

describe('Dream HasMany association', () => {
  it('builds association mapping', async () => {
    const userAssociations = User.associations.hasMany
    expect(userAssociations.length).toEqual(4)

    // compositions
    expect(userAssociations[0].foreignKey()).toEqual('user_id')
    expect(userAssociations[0].modelCB()).toEqual(Composition)

    // composition assets
    expect(userAssociations[1].through).toEqual('compositions')
    expect(userAssociations[1].foreignKey()).toEqual('user_id')
    expect(userAssociations[1].modelCB()).toEqual(CompositionAsset)
    expect(userAssociations[1].throughClass!()).toEqual(Composition)

    // composition asset audits
    expect(userAssociations[2].through).toEqual('compositionAssets')
    expect(userAssociations[2].modelCB()).toEqual(CompositionAssetAudit)
    expect(userAssociations[2].throughClass!()).toEqual(CompositionAsset)

    // balloons
    expect(userAssociations[3].foreignKey()).toEqual('user_id')
    expect(userAssociations[3].modelCB()).toEqual([Balloon.Latex, Balloon.Mylar])

    // ensure that other model associations have not
    // accidentally overwritten this one
    expect(User.associations.belongsTo).toEqual([])
  })
})
