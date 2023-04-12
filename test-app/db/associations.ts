export default {
  "users": [
    "mainComposition",
    "mainCompositionAsset",
    "mainCompositionAssetAudit",
    "compositions",
    "compositionAssets",
    "compositionAssetAudits"
  ],
  "composition_asset_audits": [
    "compositionAsset"
  ],
  "composition_assets": [
    "composition",
    "user",
    "compositionAssetAudits"
  ],
  "compositions": [
    "user",
    "compositionAssets",
    "compositionAssetAudits"
  ]
}

export interface SyncedAssociations {
  "users": "mainComposition" | "mainCompositionAsset" | "mainCompositionAssetAudit" | "compositions" | "compositionAssets" | "compositionAssetAudits","composition_asset_audits": "compositionAsset","composition_assets": "composition" | "user" | "compositionAssetAudits","compositions": "user" | "compositionAssets" | "compositionAssetAudits"
} 
  