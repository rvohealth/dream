import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset.js'
import User from '../../../../test-app/app/models/User.js'

describe('Query#leftJoin with aliased associations', () => {
  it('handles conflicting aliases correctly when namespaced', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user })
    await CompositionAsset.create({ composition, name: '1' })
    await CompositionAsset.create({ composition, name: '2' })

    const matching = await User.query()
      .leftJoin('compositionAssets')
      .leftJoin('compositions as c1', 'compositionAssets as c2')
      .where({ 'c2.name': '2', 'compositionAssets.name': '1' })
      .firstOrFail()
    expect(matching).toMatchDreamModel(user)

    // the where clause (unlike a join and-clause) still filters out the user
    const notMatching = await User.query()
      .leftJoin('compositionAssets')
      .leftJoin('compositions as c1', 'compositionAssets as c2')
      .where({ 'c2.name': '2', 'compositionAssets.name': 'not found' })
      .first()
    expect(notMatching).toBeNull()
  })

  context('with aliased associations', () => {
    context('HasOne/HasMany association', () => {
      it('includes and-clauses when aliased, keeping parents without a matching row', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.create({ user, content: 'chalupas' })

        const otherUser = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        await Composition.create({ user: otherUser, content: 'chalupaz' })

        const users = await User.query()
          .leftJoin('compositions as c1', { and: { content: 'chalupas' } })
          .all()
        expect(users).toMatchDreamModels([user, otherUser])

        const rows = await User.query()
          .leftJoin('compositions as c1', { and: { content: 'chalupas' } })
          .order('id')
          .pluck('id', 'c1.content')
        expect(rows).toEqual([
          [user.id, 'chalupas'],
          [otherUser.id, null],
        ])
      })
    })

    context('BelongsTo association', () => {
      it('includes and-clauses when aliased, keeping parents without a matching row', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user, content: 'chalupas' })

        const otherUser = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const otherComposition = await Composition.create({ user: otherUser, content: 'chalupaz' })

        const compositions = await Composition.query()
          .leftJoin('user as u', { and: { email: 'fred@frewd' } })
          .all()
        expect(compositions).toMatchDreamModels([composition, otherComposition])

        const rows = await Composition.query()
          .leftJoin('user as u', { and: { email: 'fred@frewd' } })
          .order('id')
          .pluck('id', 'u.email')
        expect(rows).toEqual([
          [composition.id, 'fred@frewd'],
          [otherComposition.id, null],
        ])
      })
    })

    context('with an array of association instances in the and-clause', () => {
      it('scopes the expanded foreign keys to the alias', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })
        const compositionAsset = await CompositionAsset.create({ composition })

        const otherUser = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const otherComposition = await Composition.create({ user: otherUser })
        const otherCompositionAsset = await CompositionAsset.create({ composition: otherComposition })

        const compositionAssets = await CompositionAsset.query()
          .leftJoin('composition as c', { and: { user: [user] } })
          .all()
        expect(compositionAssets).toMatchDreamModels([compositionAsset, otherCompositionAsset])

        const rows = await CompositionAsset.query()
          .leftJoin('composition as c', { and: { user: [user] } })
          .order('id')
          .pluck('id', 'c.id')
        expect(rows).toEqual([
          [compositionAsset.id, composition.id],
          [otherCompositionAsset.id, null],
        ])
      })
    })
  })

  context('within a transaction', () => {
    it('handles conflicting aliases correctly when namespaced', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      let matching: User | undefined = undefined
      let notMatching: User | null | undefined = undefined

      await ApplicationModel.transaction(async txn => {
        const composition = await Composition.txn(txn).create({ user })
        await CompositionAsset.txn(txn).create({ composition, name: '1' })
        await CompositionAsset.txn(txn).create({ composition, name: '2' })

        matching = await User.txn(txn)
          .leftJoin('compositionAssets')
          .leftJoin('compositions as c1', 'compositionAssets as c2')
          .where({ 'c2.name': '2', 'compositionAssets.name': '1' })
          .firstOrFail()

        notMatching = await User.txn(txn)
          .leftJoin('compositionAssets')
          .leftJoin('compositions as c1', 'compositionAssets as c2')
          .where({ 'c2.name': '2', 'compositionAssets.name': 'not found' })
          .first()
      })

      expect(matching).toMatchDreamModel(user)
      expect(notMatching).toBeNull()
    })
  })

  context('type tests', () => {
    it.skip('does not break when a single aliased argument is provided', () => {
      User.leftJoin('compositions as c')
      User.query().leftJoin('compositions as c')
      User.txn(undefined as any).leftJoin('compositions as c')
    })
  })
})
