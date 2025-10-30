import CalendarDate from '../../../src/helpers/CalendarDate.js'
import { DateTime } from '../../../src/helpers/DateTime.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import ModelForOpenapiTypeSpecs from '../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.first', () => {
  it('finds the first record in the db, sorting by id', async () => {
    const u1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const results = await User.first()
    expect(results!.id).toEqual(u1.id)
  })

  it('marshals to the proper type', async () => {
    await ModelForOpenapiTypeSpecs.create({
      passwordDigest: 'abcd',
      name: 'Charlie',
      nicknames: ['Chuck', 'Luce'],
      requiredNicknames: ['Chuck', 'Luce'],
      email: 'a@b.com',
      notes: 'Hello world',
      birthdate: CalendarDate.fromISO('1993-11-03'),
      volume: 123.456,
      favoriteCitext: 'Goodbye',
      // requiredFavoriteCitext: sql`citext`, col => col.notNull().defaultTo('chalupas')),
      favoriteCitexts: ['Hello_1', 'world_1', 'goodbye_1'],
      // requiredFavoriteCitexts: [],
      favoriteUuids: ['8773f04c-affc-4389-9fb5-121679949589', '3bce3b47-937e-461e-be84-46673155a8ba'],
      // requiredFavoriteUuids: ,
      favoriteDates: [CalendarDate.fromISO('1987-07-22'), CalendarDate.fromISO('1987-07-22')],
      // requiredFavoriteDates: sql`date[]`, col => col.defaultTo('{}').notNull()),
      favoriteDatetimes: [DateTime.fromISO('1987-07-22'), DateTime.fromISO('1987-07-22')],
      // requiredFavoriteDatetimes: sql`timestamp[]`, col => col.defaultTo('{}').notNull()),
      favoriteJsons: [{ hello_1: 'world_1' }],
      // requiredFavoriteJsons: sql`json[]`, col => col.defaultTo('{}').notNull()),
      favoriteJsonbs: [{ hello_2: 'world_2' }],
      // requiredFavoriteJsonbs: sql`jsonb[]`, col => col.defaultTo('{}').notNull()),
      favoriteTexts: ['Hello_1', 'world_1', 'goodbye_1'],
      // requiredFavoriteTexts: sql`text[]`, col => col.defaultTo('{}').notNull()),
      favoriteNumerics: [1.3, 7],
      // requiredFavoriteNumerics: sql`numeric[]`, col => col.defaultTo('{}').notNull()),
      favoriteBooleans: [true, false, true, true, false],
      // requiredFavoriteBooleans: sql`boolean[]`, col => col.defaultTo('{}').notNull()),
      favoriteBigint: '77777777777777777',
      // requiredFavoriteBigint: sql`bigint`, col => col.defaultTo(0).notNull()),
      favoriteBigints: ['77777777777777777'],
      // requiredFavoriteBigints: sql`bigint[]`, col => col.defaultTo('{}').notNull()),
      favoriteIntegers: [1, 2, 3, 4, 5, 6, 7],
      // requiredFavoriteIntegers: sql`integer[]`, col => col.defaultTo('{}').notNull()),
      likesWalks: true,
      species: 'cat',
      favoriteTreats: ['efishy feesh'],
    })

    const model = (await ModelForOpenapiTypeSpecs.first())!

    expect(model.name).toEqual('Charlie')
    expect(model.nicknames).toEqual(['Chuck', 'Luce'])
    expect(model.requiredNicknames).toEqual(['Chuck', 'Luce'])
    expect(model.email).toEqual('a@b.com')
    expect(model.notes).toEqual('Hello world')
    expect(model.birthdate).toEqual(CalendarDate.fromISO('1993-11-03'))
    expect(model.volume).toEqual(123.456)
    expect(model.favoriteCitext).toEqual('Goodbye')
    expect(model.requiredFavoriteCitext).toEqual('chalupas')
    expect(model.favoriteCitexts).toEqual(['Hello_1', 'world_1', 'goodbye_1'])
    expect(model.requiredFavoriteCitexts).toEqual([])
    expect(model.favoriteUuids).toEqual([
      '8773f04c-affc-4389-9fb5-121679949589',
      '3bce3b47-937e-461e-be84-46673155a8ba',
    ])
    expect(model.requiredFavoriteUuids).toEqual([])
    expect(model.favoriteDates![0]).toEqualCalendarDate(CalendarDate.fromISO('1987-07-22'))
    expect(model.favoriteDates![1]).toEqualCalendarDate(CalendarDate.fromISO('1987-07-22'))
    expect(model.requiredFavoriteDates).toEqual([])
    expect(model.favoriteDatetimes![0]).toEqualDateTime(DateTime.fromISO('1987-07-22'))
    expect(model.favoriteDatetimes![1]).toEqualDateTime(DateTime.fromISO('1987-07-22'))
    expect(model.requiredFavoriteDatetimes).toEqual([])
    // expect(model.favoriteJsons).toEqual([{ hello_1: 'world_1' }])
    expect(model.favoriteJsons).toEqual([{ hello1: 'world_1' }])
    expect(model.requiredFavoriteJsons).toEqual([])
    // expect(model.favoriteJsonbs).toEqual([{ hello_2: 'world_2' }])
    expect(model.favoriteJsonbs).toEqual([{ hello2: 'world_2' }])
    expect(model.requiredFavoriteJsonbs).toEqual([])
    expect(model.favoriteTexts).toEqual(['Hello_1', 'world_1', 'goodbye_1'])
    expect(model.requiredFavoriteTexts).toEqual([])
    expect(model.favoriteNumerics).toEqual([1.3, 7])
    expect(model.requiredFavoriteNumerics).toEqual([])
    expect(model.favoriteBooleans).toEqual([true, false, true, true, false])
    expect(model.requiredFavoriteBooleans).toEqual([])
    expect(model.favoriteBigint).toEqual('77777777777777777')
    expect(model.requiredFavoriteBigint).toEqual('0')
    expect(model.favoriteBigints).toEqual(['77777777777777777'])
    expect(model.requiredFavoriteBigints).toEqual([])
    expect(model.favoriteIntegers).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(model.requiredFavoriteIntegers).toEqual([])
    expect(model.likesWalks).toEqual(true)
    expect(model.species).toEqual('cat')
    expect(model.favoriteTreats).toEqual(['efishy feesh'])
  })

  context('when passed a transaction', () => {
    it('can find the first record within a transaction', async () => {
      let user: User | null = null
      await ApplicationModel.transaction(async txn => {
        await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        user = await User.txn(txn).first()
      })
      expect(user!.email).toEqual('fred@frewd')
    })
  })
})
