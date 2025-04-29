import { Decorators, DreamColumn } from '../../../src/index.js'
import ApplicationModel from './ApplicationModel.js'

const deco = new Decorators<typeof ModelForOpenapiTypeSpecs>()

export default class ModelForOpenapiTypeSpecs extends ApplicationModel {
  public override get table() {
    return 'model_for_openapi_type_specs' as const
  }

  public id: DreamColumn<ModelForOpenapiTypeSpecs, 'id'>
  public name: DreamColumn<ModelForOpenapiTypeSpecs, 'name'>
  public nicknames: DreamColumn<ModelForOpenapiTypeSpecs, 'nicknames'>
  public requiredNicknames: DreamColumn<ModelForOpenapiTypeSpecs, 'requiredNicknames'>
  public email: DreamColumn<ModelForOpenapiTypeSpecs, 'email'>
  public birthdate: DreamColumn<ModelForOpenapiTypeSpecs, 'birthdate'>

  public volume: DreamColumn<ModelForOpenapiTypeSpecs, 'volume'>

  // begin: favorite records (used for checking type validation in Params.for)
  public favoriteCitext: DreamColumn<ModelForOpenapiTypeSpecs, 'favoriteCitext'>
  public requiredFavoriteCitext: DreamColumn<ModelForOpenapiTypeSpecs, 'requiredFavoriteCitext'>
  public favoriteCitexts: DreamColumn<ModelForOpenapiTypeSpecs, 'favoriteCitexts'>
  public requiredFavoriteCitexts: DreamColumn<ModelForOpenapiTypeSpecs, 'requiredFavoriteCitexts'>
  public favoriteUuids: DreamColumn<ModelForOpenapiTypeSpecs, 'favoriteUuids'>
  public requiredFavoriteUuids: DreamColumn<ModelForOpenapiTypeSpecs, 'requiredFavoriteUuids'>
  public favoriteDates: DreamColumn<ModelForOpenapiTypeSpecs, 'favoriteDates'>
  public requiredFavoriteDates: DreamColumn<ModelForOpenapiTypeSpecs, 'requiredFavoriteDates'>
  public favoriteDatetimes: DreamColumn<ModelForOpenapiTypeSpecs, 'favoriteDatetimes'>
  public requiredFavoriteDatetimes: DreamColumn<ModelForOpenapiTypeSpecs, 'requiredFavoriteDatetimes'>
  public favoriteJsons: DreamColumn<ModelForOpenapiTypeSpecs, 'favoriteJsons'>
  public requiredFavoriteJsons: DreamColumn<ModelForOpenapiTypeSpecs, 'requiredFavoriteJsons'>
  public favoriteJsonbs: DreamColumn<ModelForOpenapiTypeSpecs, 'favoriteJsonbs'>
  public requiredFavoriteJsonbs: DreamColumn<ModelForOpenapiTypeSpecs, 'requiredFavoriteJsonbs'>
  public favoriteTexts: DreamColumn<ModelForOpenapiTypeSpecs, 'favoriteTexts'>
  public requiredFavoriteTexts: DreamColumn<ModelForOpenapiTypeSpecs, 'requiredFavoriteTexts'>
  public favoriteNumerics: DreamColumn<ModelForOpenapiTypeSpecs, 'favoriteNumerics'>
  public requiredFavoriteNumerics: DreamColumn<ModelForOpenapiTypeSpecs, 'requiredFavoriteNumerics'>
  public favoriteBooleans: DreamColumn<ModelForOpenapiTypeSpecs, 'favoriteBooleans'>
  public requiredFavoriteBooleans: DreamColumn<ModelForOpenapiTypeSpecs, 'requiredFavoriteBooleans'>
  public favoriteBigint: DreamColumn<ModelForOpenapiTypeSpecs, 'favoriteBigint'>
  public requiredFavoriteBigint: DreamColumn<ModelForOpenapiTypeSpecs, 'requiredFavoriteBigint'>
  public favoriteBigints: DreamColumn<ModelForOpenapiTypeSpecs, 'favoriteBigints'>
  public requiredFavoriteBigints: DreamColumn<ModelForOpenapiTypeSpecs, 'requiredFavoriteBigints'>
  public favoriteIntegers: DreamColumn<ModelForOpenapiTypeSpecs, 'favoriteIntegers'>
  public requiredFavoriteIntegers: DreamColumn<ModelForOpenapiTypeSpecs, 'requiredFavoriteIntegers'>
  // end: favorite records

  public bio: DreamColumn<ModelForOpenapiTypeSpecs, 'bio'>
  public notes: DreamColumn<ModelForOpenapiTypeSpecs, 'notes'>
  public jsonData: DreamColumn<ModelForOpenapiTypeSpecs, 'jsonData'>
  public requiredJsonData: DreamColumn<ModelForOpenapiTypeSpecs, 'requiredJsonData'>
  public jsonbData: DreamColumn<ModelForOpenapiTypeSpecs, 'jsonbData'>
  public requiredJsonbData: DreamColumn<ModelForOpenapiTypeSpecs, 'requiredJsonbData'>
  public uuid: DreamColumn<ModelForOpenapiTypeSpecs, 'uuid'>
  public optionalUuid: DreamColumn<ModelForOpenapiTypeSpecs, 'optionalUuid'>

  public species: DreamColumn<ModelForOpenapiTypeSpecs, 'species'>
  public favoriteTreats: DreamColumn<ModelForOpenapiTypeSpecs, 'favoriteTreats'>
  public collarCount: DreamColumn<ModelForOpenapiTypeSpecs, 'collarCount'>
  public collarCountInt: DreamColumn<ModelForOpenapiTypeSpecs, 'collarCountInt'>
  public collarCountNumeric: DreamColumn<ModelForOpenapiTypeSpecs, 'collarCountNumeric'>
  public requiredCollarCount: DreamColumn<ModelForOpenapiTypeSpecs, 'requiredCollarCount'>
  public requiredCollarCountInt: DreamColumn<ModelForOpenapiTypeSpecs, 'requiredCollarCountInt'>
  public likesWalks: DreamColumn<ModelForOpenapiTypeSpecs, 'likesWalks'>
  public likesTreats: DreamColumn<ModelForOpenapiTypeSpecs, 'likesTreats'>

  public createdOn: DreamColumn<ModelForOpenapiTypeSpecs, 'createdOn'>
  public createdAt: DreamColumn<ModelForOpenapiTypeSpecs, 'createdAt'>
  public updatedAt: DreamColumn<ModelForOpenapiTypeSpecs, 'updatedAt'>

  @deco.AfterSaveCommit({ ifChanged: ['jsonData'] })
  public conditionalAfterSaveJsonDataCommitHook() {}
}
