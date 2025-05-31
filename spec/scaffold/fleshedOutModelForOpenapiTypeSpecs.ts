import { CalendarDate, DateTime } from '../../src/index.js'
import ModelForOpenapiTypeSpecs from '../../test-app/app/models/ModelForOpenapiTypeSpec.js'

export default async function fleshedOutModelForOpenapiTypeSpecs() {
  return await ModelForOpenapiTypeSpecs.create({
    name: 'Charles Brown',
    passwordDigest: 'xxxxxxxxx',
    nicknames: ['Charlie', 'Chuck'],
    requiredNicknames: ['Chuck'],
    email: 'charlie@peanuts.com',
    birthdate: CalendarDate.fromISO('1950-10-02'),
    aDatetime: DateTime.fromISO('1950-10-02'),

    volume: 7.77777,

    // begin: favorite records (used for checking type validation in Params.for)
    favoriteCitext: 'hello',
    requiredFavoriteCitext: 'world',
    favoriteCitexts: ['hello', 'world'],
    requiredFavoriteCitexts: ['world'],
    favoriteUuids: ['8773f04c-affc-4389-9fb5-121679949589', '3bce3b47-937e-461e-be84-46673155a8ba'],
    requiredFavoriteUuids: ['3bce3b47-937e-461e-be84-46673155a8ba'],
    favoriteDates: [CalendarDate.fromISO('2025-05-12'), CalendarDate.fromISO('2025-05-13')],
    requiredFavoriteDates: [CalendarDate.fromISO('2025-05-13')],
    favoriteDatetimes: [DateTime.fromISO('2025-05-12'), DateTime.fromISO('2025-05-13')],
    requiredFavoriteDatetimes: [DateTime.fromISO('2025-05-13')],
    favoriteJsons: [{ hello: 'world' }],
    requiredFavoriteJsons: [{ hello: 'world' }],
    favoriteJsonbs: [{ hello: 'world' }],
    requiredFavoriteJsonbs: [{ hello: 'world' }],
    favoriteTexts: ['hello', 'world'],
    requiredFavoriteTexts: ['world'],
    favoriteNumerics: [3.3, 7.7],
    requiredFavoriteNumerics: [7.7],
    favoriteBooleans: [true, false, true],
    requiredFavoriteBooleans: [true, false],
    favoriteBigint: '123456789098',
    requiredFavoriteBigint: '123456789098',
    favoriteBigints: ['123456789098'],
    requiredFavoriteBigints: ['123456789098'],
    favoriteIntegers: [3, 7],
    requiredFavoriteIntegers: [7],
    // end: favorite records

    bio: 'hello',
    notes: 'hello world',
    jsonData: { hello: '1' },
    requiredJsonData: { hello: '2' },
    jsonbData: { hello: '3' },
    requiredJsonbData: { hello: '4' },
    uuid: '8773f04c-affc-4389-9fb5-121679949589',
    optionalUuid: '8773f04c-affc-4389-9fb5-121679949589',

    species: 'cat',
    favoriteTreats: ['efishy feesh'],
    collarCount: 3,
    collarCountInt: 7,
    collarCountNumeric: 3.3,
    requiredCollarCount: 3,
    requiredCollarCountInt: 3,
    likesWalks: true,
    likesTreats: false,
  })
}
