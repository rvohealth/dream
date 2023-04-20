export default {
  "composition_asset_audits": {
    "compositionAsset": "composition_assets",
    "composition": "compositions",
    "user": "users"
  },
  "composition_assets": {
    "composition": "compositions",
    "user": "users",
    "compositionAssetAudits": "composition_asset_audits"
  },
  "compositions": {
    "user": "users",
    "mainCompositionAsset": "composition_assets",
    "compositionAssets": "composition_assets",
    "compositionAssetAudits": "composition_asset_audits"
  },
  "users": {
    "mainComposition": "compositions",
    "mainCompositionAsset": "composition_assets",
    "compositions": "compositions",
    "compositionAssets": "composition_assets",
    "compositionAssetAudits": "composition_asset_audits"
  }
}

export interface SyncedAssociations {
    "composition_asset_audits": {
"compositionAsset": "composition_assets"
  "composition": "compositions"
  "user": "users"}
  ,  "composition_assets": {
"composition": "compositions"
  "user": "users"
  "compositionAssetAudits": "composition_asset_audits"}
  ,  "compositions": {
"user": "users"
  "mainCompositionAsset": "composition_assets"
  "compositionAssets": "composition_assets"
  "compositionAssetAudits": "composition_asset_audits"}
  ,  "users": {
"mainComposition": "compositions"
  "mainCompositionAsset": "composition_assets"
  "compositions": "compositions"
  "compositionAssets": "composition_assets"
  "compositionAssetAudits": "composition_asset_audits"}
   
}
  