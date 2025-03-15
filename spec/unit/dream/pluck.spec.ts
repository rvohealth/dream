import { DateTime } from 'luxon'
import { CalendarDate } from '../../../src.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import ModelForOpenapiTypeSpecs from '../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream#pluck', () => {
  let user1: User
  let user2: User

  beforeEach(async () => {
    user1 = await User.create({
      email: 'fred@frewd',
      password: 'howyadoin',
      birthdate: CalendarDate.fromISO('1987-07-22'),
    })
    user2 = await User.create({
      email: 'how@yadoin',
      password: 'howyadoin',
      birthdate: CalendarDate.fromISO('1993-11-03'),
    })
  })

  it('plucks the specified attributes and returns them as raw data', async () => {
    const records = await User.pluck('id')
    expect(records).toEqual([user1.id, user2.id])
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

    const plucked = await ModelForOpenapiTypeSpecs.pluck(
      'name',
      'nicknames',
      'requiredNicknames',
      'email',
      'notes',
      'birthdate',
      'volume',
      'favoriteCitext',
      'requiredFavoriteCitext',
      'favoriteCitexts',
      'requiredFavoriteCitexts',
      'favoriteUuids',
      'requiredFavoriteUuids',
      'favoriteDates',
      'requiredFavoriteDates',
      'favoriteDatetimes',
      'requiredFavoriteDatetimes',
      'favoriteJsons',
      'requiredFavoriteJsons',
      'favoriteJsonbs',
      'requiredFavoriteJsonbs',
      'favoriteTexts',
      'requiredFavoriteTexts',
      'favoriteNumerics',
      'requiredFavoriteNumerics',
      'favoriteBooleans',
      'requiredFavoriteBooleans',
      'favoriteBigint',
      'requiredFavoriteBigint',
      'favoriteBigints',
      'requiredFavoriteBigints',
      'favoriteIntegers',
      'requiredFavoriteIntegers',
      'likesWalks',
      'species',
      'favoriteTreats'
    )

    const values = plucked[0]

    expect(values[0]).toEqual('Charlie')
    expect(values[1]).toEqual(['Chuck', 'Luce'])
    expect(values[2]).toEqual(['Chuck', 'Luce'])
    expect(values[3]).toEqual('a@b.com')
    expect(values[4]).toEqual('Hello world')
    expect(values[5]).toEqual(CalendarDate.fromISO('1993-11-03'))
    expect(values[6]).toEqual(123.456)
    expect(values[7]).toEqual('Goodbye')
    expect(values[8]).toEqual('chalupas')
    expect(values[9]).toEqual(['Hello_1', 'world_1', 'goodbye_1'])
    expect(values[10]).toEqual([])
    expect(values[11]).toEqual([
      '8773f04c-affc-4389-9fb5-121679949589',
      '3bce3b47-937e-461e-be84-46673155a8ba',
    ])
    expect(values[12]).toEqual([])
    expect(values[13]![0]).toEqualCalendarDate(CalendarDate.fromISO('1987-07-22'))
    expect(values[13]![1]).toEqualCalendarDate(CalendarDate.fromISO('1987-07-22'))
    expect(values[14]).toEqual([])
    expect(values[15]![0]).toEqualDateTime(DateTime.fromISO('1987-07-22'))
    expect(values[15]![1]).toEqualDateTime(DateTime.fromISO('1987-07-22'))
    expect(values[16]).toEqual([])
    // expect(values[17]).toEqual([{ hello_1: 'world_1' }])
    expect(values[17]).toEqual([{ hello1: 'world_1' }])
    expect(values[18]).toEqual([])
    // expect(values[19]).toEqual([{ hello_2: 'world_2' }])
    expect(values[19]).toEqual([{ hello2: 'world_2' }])
    expect(values[20]).toEqual([])
    // expect(values[21]).toEqual(['Hello_1', 'world_1', 'goodbye_1'])
    // expect(values[22]).toEqual([])
    expect(values[23]).toEqual([1.3, 7])
    expect(values[24]).toEqual([])
    expect(values[25]).toEqual([true, false, true, true, false])
    expect(values[26]).toEqual([])
    expect(values[27]).toEqual('77777777777777777')
    expect(values[28]).toEqual('0')
    expect(values[29]).toEqual(['77777777777777777'])
    expect(values[30]).toEqual([])
    expect(values[31]).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(values[32]).toEqual([])
    expect(values[33]).toEqual(true)
    expect(values[34]).toEqual('cat')
    expect(values[35]).toEqual(['efishy feesh'])
  })

  context('when encased in a transaction', () => {
    it('plucks the specified attributes and returns them as raw data', async () => {
      let user3: User | null = null
      let records: any[] = []
      await ApplicationModel.transaction(async txn => {
        user3 = await User.txn(txn).create({ email: 'fred@txn', password: 'howyadoin' })
        records = await User.txn(txn).pluck('id')
      })
      expect(records).toEqual([user1.id, user2.id, user3!.id])
    })
  })

  context('with multiple fields', () => {
    it('should return multi-dimensional array', async () => {
      const records = await User.order('id').pluck('id', 'createdAt')
      expect(records).toEqual([
        [user1.id, user1.createdAt],
        [user2.id, user2.createdAt],
      ])
    })
  })
})
