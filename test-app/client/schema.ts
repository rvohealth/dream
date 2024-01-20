export type BalloonColorsEnum = 'blue' | 'green' | 'red'
export const BalloonColorsEnumArray = [
  'blue',
  'green',
  'red'
]

export type BalloonLineMaterialsEnum = 'nylon' | 'ribbon' | 'twine' | 'yarn'
export const BalloonLineMaterialsEnumArray = [
  'nylon',
  'ribbon',
  'twine',
  'yarn'
]

export type BalloonTypesEnum = 'Animal' | 'Latex' | 'Mylar'
export const BalloonTypesEnumArray = [
  'Animal',
  'Latex',
  'Mylar'
]

export type CatTreats = 'cat-safe chalupas (catlupas,supaloopas)' | 'chicken' | 'ocean fish' | 'tuna'
export const CatTreatsArray = [
  'cat-safe chalupas (catlupas,supaloopas)',
  'chicken',
  'ocean fish',
  'tuna'
]

export type ExtraRateableTypesEnum = 'Balloon' | 'Composition' | 'Post'
export const ExtraRateableTypesEnumArray = [
  'Balloon',
  'Composition',
  'Post'
]

export type ExtraRatingTypesEnum = 'HeartRating' | 'StarRating'
export const ExtraRatingTypesEnumArray = [
  'HeartRating',
  'StarRating'
]

export type LocalesEnum = 'de-DE' | 'en-AU' | 'en-BZ' | 'en-CA' | 'en-cb' | 'en-GB' | 'en-IE' | 'en-IN' | 'en-JM' | 'en-MT' | 'en-MY' | 'en-NZ' | 'en-PH' | 'en-SG' | 'en-TT' | 'en-US' | 'en-ZA' | 'en-ZW' | 'es-ES' | 'fr-FR' | 'it-IT' | 'ja-JP' | 'ko-KR' | 'pt-BR' | 'zh-CN' | 'zh-TW'
export const LocalesEnumArray = [
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
export const LocalizableTypesEnumArray = [
  'Composition',
  'CompositionAsset'
]

export type Species = 'cat' | 'dog' | 'frog'
export const SpeciesArray = [
  'cat',
  'dog',
  'frog'
]

export interface BalloonLine {
  balloon: any
  material: any
}

export interface BalloonSpotterBalloon {
  BalloonSpotter: any
  Balloon: any
}

export interface BalloonSpotter {
  name: any
}

export interface Collar {
  pet: any
  lost: any
}

export interface EdgeCaseAttribute {
  kPop: any
  popK: any
  popKPop: any
}

export interface GraphEdgeNode {
  graph_edge: any
  graph_node: any
}

export interface GraphEdge {
  name: any
}

export interface GraphNode {
  name: any
}

export interface Pet {
  id: string
  name: string
  species: Species
}

export interface PetUnderstudyJoinModel {
}

export interface Sandbag {
  weight: any
}

