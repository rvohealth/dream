export default {
  users: {
    names: [
      'mainComposition',
      'mainCompositionAsset',
      'mainCompositionAssetAudit',
      'compositions',
      'compositionAssets',
      'compositionAssetAudits',
    ],
    nameTableMap: {
      mainComposition: 'compositions',
      mainCompositionAsset: 'composition_assets',
      mainCompositionAssetAudit: 'composition_asset_audits',
      compositions: 'compositions',
      compositionAssets: 'composition_assets',
      compositionAssetAudits: 'composition_asset_audits',
    },
  },
  composition_asset_audits: {
    names: ['compositionAsset'],
    nameTableMap: {
      compositionAsset: 'composition_assets',
    },
  },
  composition_assets: {
    names: ['composition', 'user', 'compositionAssetAudits'],
    nameTableMap: {
      composition: 'compositions',
      user: 'users',
      compositionAssetAudits: 'composition_asset_audits',
    },
  },
  compositions: {
    names: ['user', 'compositionAssets', 'compositionAssetAudits'],
    nameTableMap: {
      user: 'users',
      compositionAssets: 'composition_assets',
      compositionAssetAudits: 'composition_asset_audits',
    },
  },
}

export interface SyncedAssociations {
  users: {
    AssociationName:
      | 'mainComposition'
      | 'mainCompositionAsset'
      | 'mainCompositionAssetAudit'
      | 'compositions'
      | 'compositionAssets'
      | 'compositionAssetAudits'
    AssociationTableMap: {
      mainComposition: 'compositions'
      mainCompositionAsset: 'composition_assets'
      mainCompositionAssetAudit: 'composition_asset_audits'
      compositions: 'compositions'
      compositionAssets: 'composition_assets'
      compositionAssetAudits: 'composition_asset_audits'
    }
  }
  composition_asset_audits: {
    AssociationName: 'compositionAsset'
    AssociationTableMap: {
      compositionAsset: 'composition_assets'
    }
  }
  composition_assets: {
    AssociationName: 'composition' | 'user' | 'compositionAssetAudits'
    AssociationTableMap: {
      composition: 'compositions'
      user: 'users'
      compositionAssetAudits: 'composition_asset_audits'
    }
  }
  compositions: {
    AssociationName: 'user' | 'compositionAssets' | 'compositionAssetAudits'
    AssociationTableMap: {
      user: 'users'
      compositionAssets: 'composition_assets'
      compositionAssetAudits: 'composition_asset_audits'
    }
  }
}
