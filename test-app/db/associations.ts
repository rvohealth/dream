export default {
  "users": {
    "mainComposition": "compositions",
    "mainCompositionAsset": "composition_assets",
    "compositions": "compositions",
    "compositionAssets": "composition_assets",
    "compositionAssetAudits": "composition_asset_audits"
  },
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
    "compositionAssets": "composition_assets",
    "compositionAssetAudits": "composition_asset_audits"
  }
}

export interface SyncedAssociations {
    "users": {
"mainComposition": "compositions"
  "mainCompositionAsset": "composition_assets"
  "compositions": "compositions"
  "compositionAssets": "composition_assets"
  "compositionAssetAudits": "composition_asset_audits"}
  ,  "composition_asset_audits": {
"compositionAsset": "composition_assets"
  "composition": "compositions"
  "user": "users"}
  ,  "composition_assets": {
"composition": "compositions"
  "user": "users"
  "compositionAssetAudits": "composition_asset_audits"}
  ,  "compositions": {
"user": "users"
  "compositionAssets": "composition_assets"
  "compositionAssetAudits": "composition_asset_audits"}
   
}
  