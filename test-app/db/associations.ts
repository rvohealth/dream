export default {
  "balloons": {
    "user": [
      "users"
    ]
  },
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
  "incompatible_foreign_key_type_examples": {
    "user": [
      "users"
    ]
  },
  "pets": {
    "user": [
      "users"
    ]
  },
  "posts": {
    "user": [
      "users"
    ],
    "postVisibility": [
      "post_visibilities"
    ],
    "ratings": [
      "ratings"
    ]
  },
  "post_visibilities": {
    "post": [
      "posts"
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
    "incompatibleForeignKeyTypeExamples": [
      "incompatible_foreign_key_type_examples"
    ],
    "compositionAssets": [
      "composition_assets"
    ],
    "compositionAssetAudits": [
      "composition_asset_audits"
    ],
    "recentCompositions": [
      "compositions"
    ],
    "recentCompositionAssets": [
      "composition_assets"
    ],
    "balloons": [
      "balloons"
    ],
    "pets": [
      "pets"
    ]
  },
  "user_settings": {
    "user": [
      "users"
    ]
  }
}

export interface SyncedAssociations {
  "balloons": {
    "user": [
      "users"
    ]
  },
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
  "incompatible_foreign_key_type_examples": {
    "user": [
      "users"
    ]
  },
  "pets": {
    "user": [
      "users"
    ]
  },
  "posts": {
    "user": [
      "users"
    ],
    "postVisibility": [
      "post_visibilities"
    ],
    "ratings": [
      "ratings"
    ]
  },
  "post_visibilities": {
    "post": [
      "posts"
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
    "incompatibleForeignKeyTypeExamples": [
      "incompatible_foreign_key_type_examples"
    ],
    "compositionAssets": [
      "composition_assets"
    ],
    "compositionAssetAudits": [
      "composition_asset_audits"
    ],
    "recentCompositions": [
      "compositions"
    ],
    "recentCompositionAssets": [
      "composition_assets"
    ],
    "balloons": [
      "balloons"
    ],
    "pets": [
      "pets"
    ]
  },
  "user_settings": {
    "user": [
      "users"
    ]
  }
}

export interface SyncedBelongsToAssociations {
  "balloons": {
    "user": [
      "users"
    ]
  },
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
  "incompatible_foreign_key_type_examples": {
    "user": [
      "users"
    ]
  },
  "pets": {
    "user": [
      "users"
    ]
  },
  "posts": {
    "user": [
      "users"
    ],
    "postVisibility": [
      "post_visibilities"
    ]
  },
  "post_visibilities": false,
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
  

export interface VirtualColumns {
  "balloons": false,
  "composition_asset_audits": false,
  "composition_assets": false,
  "compositions": false,
  "incompatible_foreign_key_type_examples": false,
  "pets": false,
  "posts": false,
  "post_visibilities": false,
  "ratings": false,
  "users": [
    "password"
  ],
  "user_settings": false
}
