import { DreamColumn } from '../../../src'
import ApplicationModel from './ApplicationModel'

export default class ModelForOpenApiTypeSpecs extends ApplicationModel {
  public get table() {
    return 'model_for_open_api_type_specs' as const
  }

  // public get serializers(): DreamSerializer<ModelForOpenApiTypeSpecs> {
  //   return {}
  // }

  public id: DreamColumn<ModelForOpenApiTypeSpecs, 'id'>
  public name: DreamColumn<ModelForOpenApiTypeSpecs, 'name'>
  public nicknames: DreamColumn<ModelForOpenApiTypeSpecs, 'nicknames'>
  public requiredNicknames: DreamColumn<ModelForOpenApiTypeSpecs, 'requiredNicknames'>
  public birthdate: DreamColumn<ModelForOpenApiTypeSpecs, 'birthdate'>

  public volume: DreamColumn<ModelForOpenApiTypeSpecs, 'volume'>

  // begin: favorite records (used for checking type validation in Params.for)
  public favoriteCitext: DreamColumn<ModelForOpenApiTypeSpecs, 'favoriteCitext'>
  public requiredFavoriteCitext: DreamColumn<ModelForOpenApiTypeSpecs, 'requiredFavoriteCitext'>
  public favoriteCitexts: DreamColumn<ModelForOpenApiTypeSpecs, 'favoriteCitexts'>
  public requiredFavoriteCitexts: DreamColumn<ModelForOpenApiTypeSpecs, 'requiredFavoriteCitexts'>
  public favoriteUuids: DreamColumn<ModelForOpenApiTypeSpecs, 'favoriteUuids'>
  public requiredFavoriteUuids: DreamColumn<ModelForOpenApiTypeSpecs, 'requiredFavoriteUuids'>
  public favoriteDates: DreamColumn<ModelForOpenApiTypeSpecs, 'favoriteDates'>
  public requiredFavoriteDates: DreamColumn<ModelForOpenApiTypeSpecs, 'requiredFavoriteDates'>
  public favoriteDatetimes: DreamColumn<ModelForOpenApiTypeSpecs, 'favoriteDatetimes'>
  public requiredFavoriteDatetimes: DreamColumn<ModelForOpenApiTypeSpecs, 'requiredFavoriteDatetimes'>
  public favoriteJsons: DreamColumn<ModelForOpenApiTypeSpecs, 'favoriteJsons'>
  public requiredFavoriteJsons: DreamColumn<ModelForOpenApiTypeSpecs, 'requiredFavoriteJsons'>
  public favoriteJsonbs: DreamColumn<ModelForOpenApiTypeSpecs, 'favoriteJsonbs'>
  public requiredFavoriteJsonbs: DreamColumn<ModelForOpenApiTypeSpecs, 'requiredFavoriteJsonbs'>
  public favoriteTexts: DreamColumn<ModelForOpenApiTypeSpecs, 'favoriteTexts'>
  public requiredFavoriteTexts: DreamColumn<ModelForOpenApiTypeSpecs, 'requiredFavoriteTexts'>
  public favoriteNumerics: DreamColumn<ModelForOpenApiTypeSpecs, 'favoriteNumerics'>
  public requiredFavoriteNumerics: DreamColumn<ModelForOpenApiTypeSpecs, 'requiredFavoriteNumerics'>
  public favoriteBooleans: DreamColumn<ModelForOpenApiTypeSpecs, 'favoriteBooleans'>
  public requiredFavoriteBooleans: DreamColumn<ModelForOpenApiTypeSpecs, 'requiredFavoriteBooleans'>
  public favoriteBigint: DreamColumn<ModelForOpenApiTypeSpecs, 'favoriteBigint'>
  public requiredFavoriteBigint: DreamColumn<ModelForOpenApiTypeSpecs, 'requiredFavoriteBigint'>
  public favoriteBigints: DreamColumn<ModelForOpenApiTypeSpecs, 'favoriteBigints'>
  public requiredFavoriteBigints: DreamColumn<ModelForOpenApiTypeSpecs, 'requiredFavoriteBigints'>
  public favoriteIntegers: DreamColumn<ModelForOpenApiTypeSpecs, 'favoriteIntegers'>
  public requiredFavoriteIntegers: DreamColumn<ModelForOpenApiTypeSpecs, 'requiredFavoriteIntegers'>
  // end: favorite records

  public bio: DreamColumn<ModelForOpenApiTypeSpecs, 'bio'>
  public notes: DreamColumn<ModelForOpenApiTypeSpecs, 'notes'>
  public jsonData: DreamColumn<ModelForOpenApiTypeSpecs, 'jsonData'>
  public requiredJsonData: DreamColumn<ModelForOpenApiTypeSpecs, 'requiredJsonData'>
  public jsonbData: DreamColumn<ModelForOpenApiTypeSpecs, 'jsonbData'>
  public requiredJsonbData: DreamColumn<ModelForOpenApiTypeSpecs, 'requiredJsonbData'>
  public uuid: DreamColumn<ModelForOpenApiTypeSpecs, 'uuid'>
  public optionalUuid: DreamColumn<ModelForOpenApiTypeSpecs, 'optionalUuid'>

  public species: DreamColumn<ModelForOpenApiTypeSpecs, 'species'>
  public favoriteTreats: DreamColumn<ModelForOpenApiTypeSpecs, 'favoriteTreats'>
  public collarCount: DreamColumn<ModelForOpenApiTypeSpecs, 'collarCount'>
  public collarCountInt: DreamColumn<ModelForOpenApiTypeSpecs, 'collarCountInt'>
  public collarCountNumeric: DreamColumn<ModelForOpenApiTypeSpecs, 'collarCountNumeric'>
  public requiredCollarCount: DreamColumn<ModelForOpenApiTypeSpecs, 'requiredCollarCount'>
  public requiredCollarCountInt: DreamColumn<ModelForOpenApiTypeSpecs, 'requiredCollarCountInt'>
  public requiredCollarCountNumeric: DreamColumn<ModelForOpenApiTypeSpecs, 'requiredCollarCountNumeric'>
  public likesWalks: DreamColumn<ModelForOpenApiTypeSpecs, 'likesWalks'>
  public likesTreats: DreamColumn<ModelForOpenApiTypeSpecs, 'likesTreats'>

  public createdOn: DreamColumn<ModelForOpenApiTypeSpecs, 'createdOn'>
  public createdAt: DreamColumn<ModelForOpenApiTypeSpecs, 'createdAt'>
  public updatedAt: DreamColumn<ModelForOpenApiTypeSpecs, 'updatedAt'>
}
