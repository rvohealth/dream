export default {
  "composition_asset_audits": {
    "compositionAsset": [
      "composition_assets"
    ],
    "composition": [
      "compositions"
    ],
    "user": [
      "users"
    ]
  },
  "composition_assets": {
    "composition": [
      "compositions"
    ],
    "user": [
      "users"
    ],
    "compositionAssetAudits": [
      "composition_asset_audits"
    ]
  },
  "compositions": {
    "user": [
      "users"
    ],
    "mainCompositionAsset": [
      "composition_assets"
    ],
    "compositionAssets": [
      "composition_assets"
    ],
    "compositionAssetAudits": [
      "composition_asset_audits"
    ]
  },
  "posts": {
    "user": [
      "users"
    ],
    "ratings": [
      "ratings"
    ]
  },
  "ratings": {
    "user": [
      "users"
    ],
    "rateable": [
      "compositions",
      "posts"
    ]
  },
  "users": {
    "userSettings": [
      "user_settings"
    ],
    "mainComposition": [
      "compositions"
    ],
    "mainCompositionAsset": [
      "composition_assets"
    ],
    "compositions": [
      "compositions"
    ],
    "compositionAssets": [
      "composition_assets"
    ],
    "compositionAssetAudits": [
      "composition_asset_audits"
    ]
  },
  "user_settings": {
    "user": [
      "users"
    ]
  }
}

export interface SyncedAssociations {
  "composition_asset_audits": {
    "compositionAsset": [
      "composition_assets"
    ],
    "composition": [
      "compositions"
    ],
    "user": [
      "users"
    ]
  },
  "composition_assets": {
    "composition": [
      "compositions"
    ],
    "user": [
      "users"
    ],
    "compositionAssetAudits": [
      "composition_asset_audits"
    ]
  },
  "compositions": {
    "user": [
      "users"
    ],
    "mainCompositionAsset": [
      "composition_assets"
    ],
    "compositionAssets": [
      "composition_assets"
    ],
    "compositionAssetAudits": [
      "composition_asset_audits"
    ]
  },
  "posts": {
    "user": [
      "users"
    ],
    "ratings": [
      "ratings"
    ]
  },
  "ratings": {
    "user": [
      "users"
    ],
    "rateable": [
      "compositions",
      "posts"
    ]
  },
  "users": {
    "userSettings": [
      "user_settings"
    ],
    "mainComposition": [
      "compositions"
    ],
    "mainCompositionAsset": [
      "composition_assets"
    ],
    "compositions": [
      "compositions"
    ],
    "compositionAssets": [
      "composition_assets"
    ],
    "compositionAssetAudits": [
      "composition_asset_audits"
    ]
  },
  "user_settings": {
    "user": [
      "users"
    ]
  }
}

export interface SyncedBelongsToAssociations {
  "composition_asset_audits": {
    "compositionAsset": [
      "composition_assets"
    ]
  },
  "composition_assets": {
    "composition": [
      "compositions"
    ]
  },
  "compositions": {
    "user": [
      "users"
    ]
  },
  "posts": {
    "user": [
      "users"
    ]
  },
  "ratings": {
    "user": [
      "users"
    ],
    "rateable": [
      "compositions",
      "posts"
    ]
  },
  "users": false,
  "user_settings": {
    "user": [
      "users"
    ]
  }
}
  