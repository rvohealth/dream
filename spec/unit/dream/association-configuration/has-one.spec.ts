import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import User from '../../../../test-app/app/models/User'
import UserSettings from '../../../../test-app/app/models/UserSettings'

describe('Dream HasOne association', () => {
  it('builds association mapping', async () => {
    const userAssociations = User.associations.hasOne
    expect(userAssociations.length).toEqual(3)

    expect(userAssociations[0].foreignKey()).toEqual('userId')
    expect(userAssociations[0].modelCB()).toEqual(UserSettings)

    expect(userAssociations[1].foreignKey()).toEqual('userId')
    expect(userAssociations[1].modelCB()).toEqual(Composition)

    expect(userAssociations[2].foreignKey()).toEqual('userId')
    expect(userAssociations[2].modelCB()).toEqual(CompositionAsset)

    // ensure that other model associations have not
    // accidentally overwritten this one
    expect(User.associations.belongsTo).toEqual([])
  })
})
