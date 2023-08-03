import Balloon from '../../../../test-app/app/models/Balloon'
import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import CompositionAssetAudit from '../../../../test-app/app/models/CompositionAssetAudit'
import IncompatibleForeignKeyTypeExample from '../../../../test-app/app/models/IncompatibleForeignKeyTypeExample'
import User from '../../../../test-app/app/models/User'

describe('Dream HasMany association', () => {
  it('builds association mapping', async () => {
    const userAssociations = User.associations.hasMany
    expect(userAssociations.length).toEqual(12)

    // compositions
    expect(userAssociations[0].foreignKey()).toEqual('user_id')
    expect(userAssociations[0].modelCB()).toEqual(Composition)

    // Invalid foreign key type examples
    expect(userAssociations[1].foreignKey()).toEqual('user_id')
    expect(userAssociations[1].modelCB()).toEqual(IncompatibleForeignKeyTypeExample)

    // composition assets
    expect(userAssociations[2].through).toEqual('compositions')
    expect(userAssociations[2].foreignKey()).toEqual('user_id')
    expect(userAssociations[2].modelCB()).toEqual(CompositionAsset)

    // composition asset audits
    expect(userAssociations[3].through).toEqual('compositionAssets')
    expect(userAssociations[3].modelCB()).toEqual(CompositionAssetAudit)

    // balloons
    expect(userAssociations[4].foreignKey()).toEqual('user_id')
    expect(userAssociations[4].modelCB()).toEqual(Composition)

    // ensure that other model associations have not
    // accidentally overwritten this one
    expect(User.associations.belongsTo).toEqual([])
  })
})
