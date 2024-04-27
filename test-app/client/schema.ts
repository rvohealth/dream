export type BalloonColorsEnum = 'blue' | 'green' | 'red'
export const BalloonColorsEnumValues = [
  'blue',
  'green',
  'red'
]

export type BalloonLineMaterialsEnum = 'nylon' | 'ribbon' | 'twine' | 'yarn'
export const BalloonLineMaterialsEnumValues = [
  'nylon',
  'ribbon',
  'twine',
  'yarn'
]

export type BalloonTypesEnum = 'Animal' | 'Latex' | 'Mylar'
export const BalloonTypesEnumValues = [
  'Animal',
  'Latex',
  'Mylar'
]

export type CatTreats = 'cat-safe chalupas (catlupas,supaloopas)' | 'chicken' | 'ocean fish' | 'tuna'
export const CatTreatsValues = [
  'cat-safe chalupas (catlupas,supaloopas)',
  'chicken',
  'ocean fish',
  'tuna'
]

export type ExtraRateableTypesEnum = 'Balloon' | 'Composition' | 'Post'
export const ExtraRateableTypesEnumValues = [
  'Balloon',
  'Composition',
  'Post'
]

export type ExtraRatingTypesEnum = 'HeartRating' | 'StarRating'
export const ExtraRatingTypesEnumValues = [
  'HeartRating',
  'StarRating'
]

export type LocalesEnum = 'de-DE' | 'en-AU' | 'en-BZ' | 'en-CA' | 'en-cb' | 'en-GB' | 'en-IE' | 'en-IN' | 'en-JM' | 'en-MT' | 'en-MY' | 'en-NZ' | 'en-PH' | 'en-SG' | 'en-TT' | 'en-US' | 'en-ZA' | 'en-ZW' | 'es-ES' | 'fr-FR' | 'it-IT' | 'ja-JP' | 'ko-KR' | 'pt-BR' | 'zh-CN' | 'zh-TW'
export const LocalesEnumValues = [
  'de-DE',
  'en-AU',
  'en-BZ',
  'en-CA',
  'en-cb',
  'en-GB',
  'en-IE',
  'en-IN',
  'en-JM',
  'en-MT',
  'en-MY',
  'en-NZ',
  'en-PH',
  'en-SG',
  'en-TT',
  'en-US',
  'en-ZA',
  'en-ZW',
  'es-ES',
  'fr-FR',
  'it-IT',
  'ja-JP',
  'ko-KR',
  'pt-BR',
  'zh-CN',
  'zh-TW'
]

export type LocalizableTypesEnum = 'Composition' | 'CompositionAsset'
export const LocalizableTypesEnumValues = [
  'Composition',
  'CompositionAsset'
]

export type Species = 'cat' | 'dog' | 'frog'
export const SpeciesValues = [
  'cat',
  'dog',
  'frog'
]

export interface BalloonLine {
  balloon: any
  material: any
  createdAt: string
}

export interface BalloonSpotterBalloon {
  balloonSpotter: any
  balloon: BalloonSummary
  gobbledeegook: any
}

export interface BalloonSpotter {
  name: any
  balloons: BalloonSummary[]
}

export interface BalloonSummary {
  type: BalloonTypesEnum
  name: any
}

export interface Collar {
  id: any
  lost: any
  pet: Pet
}

export interface CompositionAlternate {
  id: any
  metadata: any
  compositionAssets: any[]
  localizedTexts: LocalizedTextBase[]
  currentLocalizedText: LocalizedTextBase
}

export interface Composition {
  id: any
  metadata: any
  compositionAssets: any[]
  localizedTexts: LocalizedTextBase[]
  currentLocalizedText: LocalizedTextBase
}

export interface EdgeCaseAttribute {
  kPop: boolean
  popK: string
  popKPop: number
  roundedPopKPop: number
}

export interface GraphEdgeNode {
  graph_edge: any
  graph_node: any
}

export interface GraphEdge {
  name: string
}

export interface GraphNode {
  name: any
}

export interface LocalizedTextBase {
}

export interface Pet {
  id: string
  name: string
  favoriteDaysOfWeek: number[]
  species: Species
  ratings: Rating[]
}

export interface PetUnderstudyJoinModel {
  pet: Pet
  understudy: Pet
}

export interface Post {
  postVisibility: PostVisibility
}

export interface PostVisibility {
  post: Post
}

export interface Rating {
  id: any
}

export interface Sandbag {
  weight: any
  updatedAt: string
}

