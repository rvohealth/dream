import { DateTime } from 'luxon'
import type { ColumnType } from "kysely";

export type BalloonColorsEnum = "blue" | "green" | "red";
export const BalloonColorsEnumValues = [
  "blue",
  "green",
  "red"
] as const


export type BalloonLineMaterialsEnum = "nylon" | "ribbon" | "twine" | "yarn";
export const BalloonLineMaterialsEnumValues = [
  "nylon",
  "ribbon",
  "twine",
  "yarn"
] as const


export type BalloonTypesEnum = "Animal" | "Latex" | "Mylar";
export const BalloonTypesEnumValues = [
  "Animal",
  "Latex",
  "Mylar"
] as const


export type CatTreats = "cat-safe chalupas (catlupas,supaloopas)" | "chicken" | "ocean fish" | "tuna";
export const CatTreatsValues = [
  "cat-safe chalupas (catlupas,supaloopas)",
  "chicken",
  "ocean fish",
  "tuna"
] as const


export type ExtraRateableTypesEnum = "Balloon" | "Composition" | "Post";
export const ExtraRateableTypesEnumValues = [
  "Balloon",
  "Composition",
  "Post"
] as const


export type ExtraRatingTypesEnum = "HeartRating" | "StarRating";
export const ExtraRatingTypesEnumValues = [
  "HeartRating",
  "StarRating"
] as const


export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<string, bigint | number | string, bigint | number | string>;

export type Json = ColumnType<JsonValue, string | JsonValue, string | JsonValue>;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [K in string]?: JsonValue;
};

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type LocalesEnum = "de-DE" | "en-AU" | "en-BZ" | "en-CA" | "en-cb" | "en-GB" | "en-IE" | "en-IN" | "en-JM" | "en-MT" | "en-MY" | "en-NZ" | "en-PH" | "en-SG" | "en-TT" | "en-US" | "en-ZA" | "en-ZW" | "es-ES" | "fr-FR" | "it-IT" | "ja-JP" | "ko-KR" | "pt-BR" | "zh-CN" | "zh-TW";
export const LocalesEnumValues = [
  "de-DE",
  "en-AU",
  "en-BZ",
  "en-CA",
  "en-cb",
  "en-GB",
  "en-IE",
  "en-IN",
  "en-JM",
  "en-MT",
  "en-MY",
  "en-NZ",
  "en-PH",
  "en-SG",
  "en-TT",
  "en-US",
  "en-ZA",
  "en-ZW",
  "es-ES",
  "fr-FR",
  "it-IT",
  "ja-JP",
  "ko-KR",
  "pt-BR",
  "zh-CN",
  "zh-TW"
] as const


export type LocalizableTypesEnum = "Composition" | "CompositionAsset";
export const LocalizableTypesEnumValues = [
  "Composition",
  "CompositionAsset"
] as const


export type Numeric = ColumnType<string, number | string, number | string>;

export type Species = "cat" | "dog" | "frog";
export const SpeciesValues = [
  "cat",
  "dog",
  "frog"
] as const

type IdType = string | number | bigint | undefined
type Timestamp = ColumnType<DateTime>

export interface BalloonLines {
  balloonId: Int8;
  createdAt: Timestamp;
  id: Generated<Int8>;
  material: BalloonLineMaterialsEnum | null;
  updatedAt: Timestamp;
}

export interface BalloonSpotterBalloons {
  balloonId: Int8;
  balloonSpotterId: Int8;
  createdAt: Timestamp;
  id: Generated<Int8>;
  updatedAt: Timestamp;
  userId: Int8 | null;
}

export interface BalloonSpotters {
  createdAt: Timestamp;
  id: Generated<Int8>;
  name: string | null;
  updatedAt: Timestamp;
}

export interface BeautifulBalloons {
  color: BalloonColorsEnum | null;
  createdAt: Timestamp;
  deletedAt: Timestamp | null;
  id: Generated<Int8>;
  multicolor: BalloonColorsEnum[] | null;
  positionAlpha: number | null;
  positionBeta: number | null;
  type: BalloonTypesEnum;
  updatedAt: Timestamp;
  userId: Int8 | null;
  volume: Numeric | null;
}

export interface Collars {
  balloonId: Int8 | null;
  createdAt: Timestamp;
  hidden: Generated<boolean | null>;
  id: Generated<Int8>;
  lost: boolean | null;
  petId: Int8;
  position: number;
  tagName: string | null;
  updatedAt: Timestamp;
}

export interface CompositionAssetAudits {
  approval: boolean | null;
  compositionAssetId: Int8;
  createdAt: Timestamp;
  id: Generated<Int8>;
  notes: string | null;
  updatedAt: Timestamp;
}

export interface CompositionAssets {
  compositionId: Int8;
  createdAt: Timestamp;
  id: Generated<Int8>;
  name: string | null;
  primary: Generated<boolean | null>;
  score: Generated<number | null>;
  src: string | null;
  updatedAt: Timestamp;
}

export interface Compositions {
  content: string | null;
  createdAt: Timestamp;
  id: Generated<Int8>;
  metadata2: Json | null;
  metadata3: Json | null;
  metadata: Generated<Json>;
  primary: Generated<boolean | null>;
  updatedAt: Timestamp;
  userId: Int8;
}

export interface EdgeCaseAttributes {
  createdAt: Timestamp;
  id: Generated<Int8>;
  kPop: boolean | null;
  popK: string | null;
  popKPop: number | null;
  updatedAt: Timestamp;
}

export interface ExtraRatings {
  body: string | null;
  createdAt: Timestamp;
  extraRateableId: Int8;
  extraRateableType: ExtraRateableTypesEnum;
  id: Generated<Int8>;
  rating: number | null;
  type: ExtraRatingTypesEnum;
  updatedAt: Timestamp;
  userId: Int8;
}

export interface GraphEdgeNodes {
  createdAt: Timestamp;
  edgeId: Int8;
  id: Generated<Int8>;
  multiScopedPosition: number;
  nodeId: Int8;
  position: number;
  updatedAt: Timestamp;
}

export interface GraphEdges {
  createdAt: Timestamp;
  id: Generated<Int8>;
  name: string | null;
  updatedAt: Timestamp;
  weight: Numeric | null;
}

export interface GraphNodes {
  createdAt: Timestamp;
  id: Generated<Int8>;
  name: string | null;
  omittedEdgePosition: number | null;
  updatedAt: Timestamp;
}

export interface IncompatibleForeignKeyTypeExamples {
  createdAt: Timestamp;
  id: Generated<Int8>;
  updatedAt: Timestamp;
  userId: number;
}

export interface LocalizedTexts {
  body: string | null;
  createdAt: Timestamp;
  id: Generated<Int8>;
  locale: LocalesEnum;
  localizableId: Int8;
  localizableType: LocalizableTypesEnum;
  name: string | null;
  title: string | null;
  updatedAt: Timestamp;
}

export interface ModelWithoutUpdatedAt {
  cantUpdateThis: string | null;
  createdAt: Timestamp;
  id: Generated<Int8>;
  name: string | null;
}

export interface Pets {
  createdAt: Timestamp;
  deletedAt: Timestamp | null;
  favoriteDaysOfWeek: number[] | null;
  favoriteTreats: CatTreats[] | null;
  id: Generated<Int8>;
  name: string | null;
  nickname: string | null;
  positionWithinSpecies: number;
  species: Species | null;
  userId: Int8 | null;
  userUuid: string | null;
}

export interface PetUnderstudyJoinModels {
  createdAt: Timestamp;
  id: Generated<Int8>;
  petId: Int8;
  understudyId: Int8;
  updatedAt: Timestamp;
}

export interface Posts {
  body: string | null;
  createdAt: Timestamp;
  deletedAt: Timestamp | null;
  id: Generated<Int8>;
  position: number;
  postVisibilityId: Int8 | null;
  updatedAt: Timestamp;
  userId: Int8;
}

export interface PostVisibilities {
  createdAt: Timestamp;
  id: Generated<Int8>;
  notes: string | null;
  updatedAt: Timestamp;
  visibility: boolean | null;
}

export interface Ratings {
  body: string | null;
  createdAt: Timestamp;
  id: Generated<Int8>;
  rateableId: Int8;
  rateableType: string;
  rating: number | null;
  updatedAt: Timestamp;
  userId: Int8;
}

export interface Sandbags {
  balloonId: Int8;
  createdAt: Timestamp;
  id: Generated<Int8>;
  updatedAt: Timestamp;
  weight: number | null;
  weightKgs: number | null;
  weightTons: number | null;
}

export interface Users {
  birthdate: Timestamp | null;
  createdAt: Timestamp;
  deletedAt: Timestamp | null;
  email: string;
  favoriteNumbers: number[] | null;
  featuredPostPosition: number | null;
  id: Generated<Int8>;
  name: string | null;
  passwordDigest: string;
  socialSecurityNumber: string | null;
  targetRating: number | null;
  updatedAt: Timestamp;
  uuid: Generated<string>;
}

export interface UserSettings {
  createdAt: Timestamp;
  id: Generated<Int8>;
  likesChalupas: Generated<boolean>;
  updatedAt: Timestamp;
  userId: Int8;
}

export interface DB {
  balloon_lines: BalloonLines;
  balloon_spotter_balloons: BalloonSpotterBalloons;
  balloon_spotters: BalloonSpotters;
  beautiful_balloons: BeautifulBalloons;
  collars: Collars;
  composition_asset_audits: CompositionAssetAudits;
  composition_assets: CompositionAssets;
  compositions: Compositions;
  edge_case_attributes: EdgeCaseAttributes;
  extra_ratings: ExtraRatings;
  graph_edge_nodes: GraphEdgeNodes;
  graph_edges: GraphEdges;
  graph_nodes: GraphNodes;
  incompatible_foreign_key_type_examples: IncompatibleForeignKeyTypeExamples;
  localized_texts: LocalizedTexts;
  model_without_updated_at: ModelWithoutUpdatedAt;
  pet_understudy_join_models: PetUnderstudyJoinModels;
  pets: Pets;
  post_visibilities: PostVisibilities;
  posts: Posts;
  ratings: Ratings;
  sandbags: Sandbags;
  user_settings: UserSettings;
  users: Users;
}


export const AllColumns = ['approval', 'balloonId', 'balloonLines', 'balloonSpotterBalloons', 'balloonSpotterId', 'balloonSpotters', 'beautifulBalloons', 'birthdate', 'body', 'cantUpdateThis', 'collars', 'color', 'compositionAssetAudits', 'compositionAssetId', 'compositionAssets', 'compositionId', 'compositions', 'content', 'createdAt', 'deletedAt', 'edgeCaseAttributes', 'edgeId', 'email', 'extraRateableId', 'extraRateableType', 'extraRatings', 'favoriteDaysOfWeek', 'favoriteNumbers', 'favoriteTreats', 'featuredPostPosition', 'graphEdgeNodes', 'graphEdges', 'graphNodes', 'hidden', 'id', 'incompatibleForeignKeyTypeExamples', 'kPop', 'likesChalupas', 'locale', 'localizableId', 'localizableType', 'localizedTexts', 'lost', 'material', 'metadata', 'metadata2', 'metadata3', 'modelWithoutUpdatedAt', 'multiScopedPosition', 'multicolor', 'name', 'nickname', 'nodeId', 'notes', 'omittedEdgePosition', 'passwordDigest', 'petId', 'petUnderstudyJoinModels', 'pets', 'popK', 'popKPop', 'position', 'positionAlpha', 'positionBeta', 'positionWithinSpecies', 'postVisibilities', 'postVisibilityId', 'posts', 'primary', 'rateableId', 'rateableType', 'rating', 'ratings', 'sandbags', 'score', 'socialSecurityNumber', 'species', 'src', 'tagName', 'targetRating', 'title', 'type', 'understudyId', 'updatedAt', 'userId', 'userSettings', 'userUuid', 'users', 'uuid', 'visibility', 'volume', 'weight', 'weightKgs', 'weightTons'] as const

export class DBClass {
  balloon_lines: BalloonLines
  balloon_spotter_balloons: BalloonSpotterBalloons
  balloon_spotters: BalloonSpotters
  beautiful_balloons: BeautifulBalloons
  collars: Collars
  composition_asset_audits: CompositionAssetAudits
  composition_assets: CompositionAssets
  compositions: Compositions
  edge_case_attributes: EdgeCaseAttributes
  extra_ratings: ExtraRatings
  graph_edge_nodes: GraphEdgeNodes
  graph_edges: GraphEdges
  graph_nodes: GraphNodes
  incompatible_foreign_key_type_examples: IncompatibleForeignKeyTypeExamples
  localized_texts: LocalizedTexts
  model_without_updated_at: ModelWithoutUpdatedAt
  pet_understudy_join_models: PetUnderstudyJoinModels
  pets: Pets
  post_visibilities: PostVisibilities
  posts: Posts
  ratings: Ratings
  sandbags: Sandbags
  user_settings: UserSettings
  users: Users
}

export const schema = {
  balloon_lines: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      balloonId: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      material: {
        coercedType: {} as BalloonLineMaterialsEnum | null,
        enumType: {} as BalloonLineMaterialsEnum,
        enumValues: BalloonLineMaterialsEnumValues,
        dbType: 'balloon_line_materials_enum',
        allowNull: true,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      balloon: {
        type: 'BelongsTo',
        tables: ['beautiful_balloons'],
        optional: false,
      },
    },
  },
  balloon_spotter_balloons: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      userId: {
        coercedType: {} as IdType | null,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: true,
        isArray: false,
      },
      balloonSpotterId: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      balloonId: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      user: {
        type: 'BelongsTo',
        tables: ['users'],
        optional: true,
      },
      balloonSpotter: {
        type: 'BelongsTo',
        tables: ['balloon_spotters'],
        optional: false,
      },
      balloon: {
        type: 'BelongsTo',
        tables: ['beautiful_balloons'],
        optional: false,
      },
    },
  },
  balloon_spotters: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      name: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: true,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      balloonSpotterBalloons: {
        type: 'HasMany',
        tables: ['balloon_spotter_balloons'],
        optional: null,
      },
      balloons: {
        type: 'HasMany',
        tables: ['beautiful_balloons'],
        optional: null,
      },
      users: {
        type: 'HasMany',
        tables: ['users'],
        optional: null,
      },
    },
  },
  beautiful_balloons: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      userId: {
        coercedType: {} as IdType | null,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: true,
        isArray: false,
      },
      type: {
        coercedType: {} as BalloonTypesEnum,
        enumType: {} as BalloonTypesEnum,
        enumValues: BalloonTypesEnumValues,
        dbType: 'balloon_types_enum',
        allowNull: false,
        isArray: false,
      },
      volume: {
        coercedType: {} as number | null,
        enumType: null,
        enumValues: null,
        dbType: 'numeric',
        allowNull: true,
        isArray: false,
      },
      color: {
        coercedType: {} as BalloonColorsEnum | null,
        enumType: {} as BalloonColorsEnum,
        enumValues: BalloonColorsEnumValues,
        dbType: 'balloon_colors_enum',
        allowNull: true,
        isArray: false,
      },
      positionAlpha: {
        coercedType: {} as number | null,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: true,
        isArray: false,
      },
      positionBeta: {
        coercedType: {} as number | null,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: true,
        isArray: false,
      },
      multicolor: {
        coercedType: {} as BalloonColorsEnum[] | null,
        enumType: {} as BalloonColorsEnum,
        enumValues: BalloonColorsEnumValues,
        dbType: 'balloon_colors_enum[]',
        allowNull: true,
        isArray: true,
      },
      deletedAt: {
        coercedType: {} as DateTime | null,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: true,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      user: {
        type: 'BelongsTo',
        tables: ['users'],
        optional: true,
      },
      balloonLine: {
        type: 'HasOne',
        tables: ['balloon_lines'],
        optional: null,
      },
      heartRatings: {
        type: 'HasMany',
        tables: ['extra_ratings'],
        optional: null,
      },
      sandbags: {
        type: 'HasMany',
        tables: ['sandbags'],
        optional: null,
      },
    },
  },
  collars: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      petId: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      balloonId: {
        coercedType: {} as IdType | null,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: true,
        isArray: false,
      },
      lost: {
        coercedType: {} as boolean | null,
        enumType: null,
        enumValues: null,
        dbType: 'boolean',
        allowNull: true,
        isArray: false,
      },
      hidden: {
        coercedType: {} as boolean | null,
        enumType: null,
        enumValues: null,
        dbType: 'boolean',
        allowNull: true,
        isArray: false,
      },
      tagName: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: true,
        isArray: false,
      },
      position: {
        coercedType: {} as number,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: false,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      pet: {
        type: 'BelongsTo',
        tables: ['pets'],
        optional: false,
      },
      balloon: {
        type: 'BelongsTo',
        tables: ['beautiful_balloons'],
        optional: true,
      },
    },
  },
  composition_asset_audits: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      compositionAssetId: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      notes: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'text',
        allowNull: true,
        isArray: false,
      },
      approval: {
        coercedType: {} as boolean | null,
        enumType: null,
        enumValues: null,
        dbType: 'boolean',
        allowNull: true,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      compositionAsset: {
        type: 'BelongsTo',
        tables: ['composition_assets'],
        optional: false,
      },
      composition: {
        type: 'HasOne',
        tables: ['compositions'],
        optional: null,
      },
      user: {
        type: 'HasOne',
        tables: ['users'],
        optional: null,
      },
    },
  },
  composition_assets: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      compositionId: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      name: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: true,
        isArray: false,
      },
      src: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'text',
        allowNull: true,
        isArray: false,
      },
      primary: {
        coercedType: {} as boolean | null,
        enumType: null,
        enumValues: null,
        dbType: 'boolean',
        allowNull: true,
        isArray: false,
      },
      score: {
        coercedType: {} as number | null,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: true,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      composition: {
        type: 'BelongsTo',
        tables: ['compositions'],
        optional: false,
      },
      user: {
        type: 'HasOne',
        tables: ['users'],
        optional: null,
      },
      currentLocalizedText: {
        type: 'HasOne',
        tables: ['localized_texts'],
        optional: null,
      },
      compositionAssetAudits: {
        type: 'HasMany',
        tables: ['composition_asset_audits'],
        optional: null,
      },
      localizedTexts: {
        type: 'HasMany',
        tables: ['localized_texts'],
        optional: null,
      },
    },
  },
  compositions: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      userId: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      content: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'text',
        allowNull: true,
        isArray: false,
      },
      metadata: {
        coercedType: {} as Json,
        enumType: null,
        enumValues: null,
        dbType: 'jsonb',
        allowNull: false,
        isArray: false,
      },
      metadata2: {
        coercedType: {} as Json | null,
        enumType: null,
        enumValues: null,
        dbType: 'jsonb',
        allowNull: true,
        isArray: false,
      },
      metadata3: {
        coercedType: {} as Json | null,
        enumType: null,
        enumValues: null,
        dbType: 'json',
        allowNull: true,
        isArray: false,
      },
      primary: {
        coercedType: {} as boolean | null,
        enumType: null,
        enumValues: null,
        dbType: 'boolean',
        allowNull: true,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      user: {
        type: 'BelongsTo',
        tables: ['users'],
        optional: false,
      },
      mainCompositionAsset: {
        type: 'HasOne',
        tables: ['composition_assets'],
        optional: null,
      },
      currentLocalizedText: {
        type: 'HasOne',
        tables: ['localized_texts'],
        optional: null,
      },
      compositionAssets: {
        type: 'HasMany',
        tables: ['composition_assets'],
        optional: null,
      },
      compositionAssetAudits: {
        type: 'HasMany',
        tables: ['composition_asset_audits'],
        optional: null,
      },
      mainCompositionAssetAudits: {
        type: 'HasMany',
        tables: ['composition_asset_audits'],
        optional: null,
      },
      heartRatings: {
        type: 'HasMany',
        tables: ['extra_ratings'],
        optional: null,
      },
      localizedTexts: {
        type: 'HasMany',
        tables: ['localized_texts'],
        optional: null,
      },
    },
  },
  edge_case_attributes: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      kPop: {
        coercedType: {} as boolean | null,
        enumType: null,
        enumValues: null,
        dbType: 'boolean',
        allowNull: true,
        isArray: false,
      },
      popK: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: true,
        isArray: false,
      },
      popKPop: {
        coercedType: {} as number | null,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: true,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      
    },
  },
  extra_ratings: {
    columns: {
      type: {
        coercedType: {} as ExtraRatingTypesEnum,
        enumType: {} as ExtraRatingTypesEnum,
        enumValues: ExtraRatingTypesEnumValues,
        dbType: 'extra_rating_types_enum',
        allowNull: false,
        isArray: false,
      },
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      userId: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      extraRateableId: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      extraRateableType: {
        coercedType: {} as ExtraRateableTypesEnum,
        enumType: {} as ExtraRateableTypesEnum,
        enumValues: ExtraRateableTypesEnumValues,
        dbType: 'extra_rateable_types_enum',
        allowNull: false,
        isArray: false,
      },
      rating: {
        coercedType: {} as number | null,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: true,
        isArray: false,
      },
      body: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'text',
        allowNull: true,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      user: {
        type: 'BelongsTo',
        tables: ['users'],
        optional: false,
      },
      extraRateable: {
        type: 'BelongsTo',
        tables: ['compositions', 'posts', 'beautiful_balloons'],
        optional: false,
      },
    },
  },
  graph_edge_nodes: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      edgeId: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      nodeId: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      position: {
        coercedType: {} as number,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: false,
        isArray: false,
      },
      multiScopedPosition: {
        coercedType: {} as number,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: false,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      edge: {
        type: 'BelongsTo',
        tables: ['graph_edges'],
        optional: false,
      },
      node: {
        type: 'BelongsTo',
        tables: ['graph_nodes'],
        optional: false,
      },
      justThisSibling: {
        type: 'HasOne',
        tables: ['graph_edge_nodes'],
        optional: null,
      },
      headSibling: {
        type: 'HasOne',
        tables: ['graph_edge_nodes'],
        optional: null,
      },
      siblingsIncludingMe: {
        type: 'HasMany',
        tables: ['graph_edge_nodes'],
        optional: null,
      },
      siblings: {
        type: 'HasMany',
        tables: ['graph_edge_nodes'],
        optional: null,
      },
      orderedSiblings: {
        type: 'HasMany',
        tables: ['graph_edge_nodes'],
        optional: null,
      },
      orderedSiblingsWithOrderOnSource: {
        type: 'HasMany',
        tables: ['graph_edge_nodes'],
        optional: null,
      },
      tailSiblings: {
        type: 'HasMany',
        tables: ['graph_edge_nodes'],
        optional: null,
      },
    },
  },
  graph_edges: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      name: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: true,
        isArray: false,
      },
      weight: {
        coercedType: {} as number | null,
        enumType: null,
        enumValues: null,
        dbType: 'numeric',
        allowNull: true,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      edgeNodes: {
        type: 'HasMany',
        tables: ['graph_edge_nodes'],
        optional: null,
      },
      nodes: {
        type: 'HasMany',
        tables: ['graph_nodes'],
        optional: null,
      },
    },
  },
  graph_nodes: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      name: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: true,
        isArray: false,
      },
      omittedEdgePosition: {
        coercedType: {} as number | null,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: true,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      edgeNodes: {
        type: 'HasMany',
        tables: ['graph_edge_nodes'],
        optional: null,
      },
      orderedEdgeNodes: {
        type: 'HasMany',
        tables: ['graph_edge_nodes'],
        optional: null,
      },
      edges: {
        type: 'HasMany',
        tables: ['graph_edges'],
        optional: null,
      },
      edgesOrderedByName: {
        type: 'HasMany',
        tables: ['graph_edges'],
        optional: null,
      },
      edgesOrderedByPosition: {
        type: 'HasMany',
        tables: ['graph_edges'],
        optional: null,
      },
      nonOmittedPositionEdgeNodes: {
        type: 'HasMany',
        tables: ['graph_edge_nodes'],
        optional: null,
      },
      nonOmittedPositionEdges: {
        type: 'HasMany',
        tables: ['graph_edges'],
        optional: null,
      },
      nonNodeNameEdgesOnThroughAssociation: {
        type: 'HasMany',
        tables: ['graph_edges'],
        optional: null,
      },
    },
  },
  incompatible_foreign_key_type_examples: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      userId: {
        coercedType: {} as number,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: false,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      user: {
        type: 'BelongsTo',
        tables: ['users'],
        optional: false,
      },
    },
  },
  localized_texts: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      localizableType: {
        coercedType: {} as LocalizableTypesEnum,
        enumType: {} as LocalizableTypesEnum,
        enumValues: LocalizableTypesEnumValues,
        dbType: 'localizable_types_enum',
        allowNull: false,
        isArray: false,
      },
      localizableId: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      locale: {
        coercedType: {} as LocalesEnum,
        enumType: {} as LocalesEnum,
        enumValues: LocalesEnumValues,
        dbType: 'locales_enum',
        allowNull: false,
        isArray: false,
      },
      name: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: true,
        isArray: false,
      },
      title: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: true,
        isArray: false,
      },
      body: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'text',
        allowNull: true,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      localizable: {
        type: 'BelongsTo',
        tables: ['compositions', 'composition_assets'],
        optional: false,
      },
    },
  },
  model_without_updated_at: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      name: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: true,
        isArray: false,
      },
      cantUpdateThis: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: true,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      
    },
  },
  pet_understudy_join_models: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      petId: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      understudyId: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      pet: {
        type: 'BelongsTo',
        tables: ['pets'],
        optional: false,
      },
      understudy: {
        type: 'BelongsTo',
        tables: ['pets'],
        optional: false,
      },
    },
  },
  pets: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      userId: {
        coercedType: {} as IdType | null,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: true,
        isArray: false,
      },
      userUuid: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'uuid',
        allowNull: true,
        isArray: false,
      },
      favoriteTreats: {
        coercedType: {} as CatTreats[] | null,
        enumType: {} as CatTreats,
        enumValues: CatTreatsValues,
        dbType: 'cat_treats[]',
        allowNull: true,
        isArray: true,
      },
      favoriteDaysOfWeek: {
        coercedType: {} as number[] | null,
        enumType: null,
        enumValues: null,
        dbType: 'integer[]',
        allowNull: true,
        isArray: true,
      },
      species: {
        coercedType: {} as Species | null,
        enumType: {} as Species,
        enumValues: SpeciesValues,
        dbType: 'species',
        allowNull: true,
        isArray: false,
      },
      positionWithinSpecies: {
        coercedType: {} as number,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: false,
        isArray: false,
      },
      name: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'text',
        allowNull: true,
        isArray: false,
      },
      nickname: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'text',
        allowNull: true,
        isArray: false,
      },
      deletedAt: {
        coercedType: {} as DateTime | null,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: true,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      userThroughUuid: {
        type: 'BelongsTo',
        tables: ['users'],
        optional: true,
      },
      user: {
        type: 'BelongsTo',
        tables: ['users'],
        optional: true,
      },
      featuredPost: {
        type: 'HasOne',
        tables: ['posts'],
        optional: null,
      },
      currentCollar: {
        type: 'HasOne',
        tables: ['collars'],
        optional: null,
      },
      notLostCollar: {
        type: 'HasOne',
        tables: ['collars'],
        optional: null,
      },
      ratings: {
        type: 'HasMany',
        tables: ['ratings'],
        optional: null,
      },
      featuredRatings: {
        type: 'HasMany',
        tables: ['ratings'],
        optional: null,
      },
      collars: {
        type: 'HasMany',
        tables: ['collars'],
        optional: null,
      },
      uniqueCollars: {
        type: 'HasMany',
        tables: ['collars'],
        optional: null,
      },
      uniqueBalloons: {
        type: 'HasMany',
        tables: ['beautiful_balloons'],
        optional: null,
      },
      distinctBalloons: {
        type: 'HasMany',
        tables: ['beautiful_balloons'],
        optional: null,
      },
      redBalloons: {
        type: 'HasMany',
        tables: ['beautiful_balloons'],
        optional: null,
      },
      notRedBalloons: {
        type: 'HasMany',
        tables: ['beautiful_balloons'],
        optional: null,
      },
      petUnderstudies: {
        type: 'HasMany',
        tables: ['pet_understudy_join_models'],
        optional: null,
      },
      understudies: {
        type: 'HasMany',
        tables: ['pets'],
        optional: null,
      },
    },
  },
  post_visibilities: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      visibility: {
        coercedType: {} as boolean | null,
        enumType: null,
        enumValues: null,
        dbType: 'boolean',
        allowNull: true,
        isArray: false,
      },
      notes: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'text',
        allowNull: true,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      post: {
        type: 'HasOne',
        tables: ['posts'],
        optional: null,
      },
    },
  },
  posts: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      userId: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      postVisibilityId: {
        coercedType: {} as IdType | null,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: true,
        isArray: false,
      },
      body: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'text',
        allowNull: true,
        isArray: false,
      },
      position: {
        coercedType: {} as number,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: false,
        isArray: false,
      },
      deletedAt: {
        coercedType: {} as DateTime | null,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: true,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      user: {
        type: 'BelongsTo',
        tables: ['users'],
        optional: false,
      },
      postVisibility: {
        type: 'BelongsTo',
        tables: ['post_visibilities'],
        optional: true,
      },
      ratings: {
        type: 'HasMany',
        tables: ['ratings'],
        optional: null,
      },
      heartRatings: {
        type: 'HasMany',
        tables: ['extra_ratings'],
        optional: null,
      },
    },
  },
  ratings: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      userId: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      rateableId: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      rateableType: {
        coercedType: {} as string,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: false,
        isArray: false,
      },
      rating: {
        coercedType: {} as number | null,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: true,
        isArray: false,
      },
      body: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'text',
        allowNull: true,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      user: {
        type: 'BelongsTo',
        tables: ['users'],
        optional: false,
      },
      rateable: {
        type: 'BelongsTo',
        tables: ['compositions', 'posts'],
        optional: false,
      },
    },
  },
  sandbags: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      balloonId: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      weight: {
        coercedType: {} as number | null,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: true,
        isArray: false,
      },
      weightKgs: {
        coercedType: {} as number | null,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: true,
        isArray: false,
      },
      weightTons: {
        coercedType: {} as number | null,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: true,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      mylar: {
        type: 'BelongsTo',
        tables: ['beautiful_balloons'],
        optional: false,
      },
    },
  },
  user_settings: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      userId: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      likesChalupas: {
        coercedType: {} as boolean,
        enumType: null,
        enumValues: null,
        dbType: 'boolean',
        allowNull: false,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
    },
    virtualColumns: [],
    associations: {
      user: {
        type: 'BelongsTo',
        tables: ['users'],
        optional: false,
      },
    },
  },
  users: {
    columns: {
      id: {
        coercedType: {} as IdType,
        enumType: null,
        enumValues: null,
        dbType: 'bigint',
        allowNull: false,
        isArray: false,
      },
      uuid: {
        coercedType: {} as string,
        enumType: null,
        enumValues: null,
        dbType: 'uuid',
        allowNull: false,
        isArray: false,
      },
      name: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: true,
        isArray: false,
      },
      email: {
        coercedType: {} as string,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: false,
        isArray: false,
      },
      socialSecurityNumber: {
        coercedType: {} as string | null,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: true,
        isArray: false,
      },
      birthdate: {
        coercedType: {} as DateTime | null,
        enumType: null,
        enumValues: null,
        dbType: 'date',
        allowNull: true,
        isArray: false,
      },
      featuredPostPosition: {
        coercedType: {} as number | null,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: true,
        isArray: false,
      },
      targetRating: {
        coercedType: {} as number | null,
        enumType: null,
        enumValues: null,
        dbType: 'integer',
        allowNull: true,
        isArray: false,
      },
      favoriteNumbers: {
        coercedType: {} as number[] | null,
        enumType: null,
        enumValues: null,
        dbType: 'integer[]',
        allowNull: true,
        isArray: true,
      },
      passwordDigest: {
        coercedType: {} as string,
        enumType: null,
        enumValues: null,
        dbType: 'character varying',
        allowNull: false,
        isArray: false,
      },
      createdAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      updatedAt: {
        coercedType: {} as DateTime,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: false,
        isArray: false,
      },
      deletedAt: {
        coercedType: {} as DateTime | null,
        enumType: null,
        enumValues: null,
        dbType: 'timestamp without time zone',
        allowNull: true,
        isArray: false,
      },
    },
    virtualColumns: ['password'],
    associations: {
      userSettings: {
        type: 'HasOne',
        tables: ['user_settings'],
        optional: null,
      },
      featuredPost: {
        type: 'HasOne',
        tables: ['posts'],
        optional: null,
      },
      mainComposition: {
        type: 'HasOne',
        tables: ['compositions'],
        optional: null,
      },
      mainCompositionAsset: {
        type: 'HasOne',
        tables: ['composition_assets'],
        optional: null,
      },
      firstComposition: {
        type: 'HasOne',
        tables: ['compositions'],
        optional: null,
      },
      firstComposition2: {
        type: 'HasOne',
        tables: ['compositions'],
        optional: null,
      },
      lastComposition: {
        type: 'HasOne',
        tables: ['compositions'],
        optional: null,
      },
      firstPet: {
        type: 'HasOne',
        tables: ['pets'],
        optional: null,
      },
      firstPetFromUuid: {
        type: 'HasOne',
        tables: ['pets'],
        optional: null,
      },
      firstCollarFromUuid: {
        type: 'HasOne',
        tables: ['collars'],
        optional: null,
      },
      posts: {
        type: 'HasMany',
        tables: ['posts'],
        optional: null,
      },
      ratings: {
        type: 'HasMany',
        tables: ['ratings'],
        optional: null,
      },
      featuredRatings: {
        type: 'HasMany',
        tables: ['ratings'],
        optional: null,
      },
      ratingsThroughPostsThatMatchUserTargetRating: {
        type: 'HasMany',
        tables: ['ratings'],
        optional: null,
      },
      compositions: {
        type: 'HasMany',
        tables: ['compositions'],
        optional: null,
      },
      incompatibleForeignKeyTypeExamples: {
        type: 'HasMany',
        tables: ['incompatible_foreign_key_type_examples'],
        optional: null,
      },
      compositionAssets: {
        type: 'HasMany',
        tables: ['composition_assets'],
        optional: null,
      },
      sortedCompositions: {
        type: 'HasMany',
        tables: ['compositions'],
        optional: null,
      },
      sortedCompositions2: {
        type: 'HasMany',
        tables: ['compositions'],
        optional: null,
      },
      compositionAssetAudits: {
        type: 'HasMany',
        tables: ['composition_asset_audits'],
        optional: null,
      },
      recentCompositions: {
        type: 'HasMany',
        tables: ['compositions'],
        optional: null,
      },
      notRecentCompositions: {
        type: 'HasMany',
        tables: ['compositions'],
        optional: null,
      },
      recentCompositionAssets: {
        type: 'HasMany',
        tables: ['composition_assets'],
        optional: null,
      },
      recentMainCompositionAssets: {
        type: 'HasMany',
        tables: ['composition_assets'],
        optional: null,
      },
      nonExtantCompositionAssets1: {
        type: 'HasMany',
        tables: ['composition_assets'],
        optional: null,
      },
      nonExtantCompositionAssets2: {
        type: 'HasMany',
        tables: ['composition_assets'],
        optional: null,
      },
      balloons: {
        type: 'HasMany',
        tables: ['beautiful_balloons'],
        optional: null,
      },
      balloonLines: {
        type: 'HasMany',
        tables: ['balloon_lines'],
        optional: null,
      },
      pets: {
        type: 'HasMany',
        tables: ['pets'],
        optional: null,
      },
      petsFromUuid: {
        type: 'HasMany',
        tables: ['pets'],
        optional: null,
      },
      collarsFromUuid: {
        type: 'HasMany',
        tables: ['collars'],
        optional: null,
      },
      balloonsFromUuid: {
        type: 'HasMany',
        tables: ['beautiful_balloons'],
        optional: null,
      },
    },
  },
} as const
