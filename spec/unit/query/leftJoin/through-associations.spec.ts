import MissingThroughAssociation from '../../../../src/errors/associations/MissingThroughAssociation.js'
import MissingThroughAssociationSource from '../../../../src/errors/associations/MissingThroughAssociationSource.js'
import ops from '../../../../src/ops/index.js'
import { DateTime } from '../../../../src/utils/datetime/DateTime.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import Latex from '../../../../test-app/app/models/Balloon/Latex.js'
import BalloonSpotter from '../../../../test-app/app/models/BalloonSpotter.js'
import BalloonSpotterBalloon from '../../../../test-app/app/models/BalloonSpotterBalloon.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset.js'
import CompositionAssetAudit from '../../../../test-app/app/models/CompositionAssetAudit.js'
import Post from '../../../../test-app/app/models/Post.js'
import PostComment from '../../../../test-app/app/models/PostComment.js'
import Rating from '../../../../test-app/app/models/Rating.js'
import ThroughA from '../../../../test-app/app/models/Through/A.js'
import ThroughAToOtherModelJoinModel from '../../../../test-app/app/models/Through/AToOtherModelJoinModel.js'
import ThroughB from '../../../../test-app/app/models/Through/B.js'
import ThroughMyModel from '../../../../test-app/app/models/Through/MyModel.js'
import ThroughOtherModel from '../../../../test-app/app/models/Through/OtherModel.js'
import User from '../../../../test-app/app/models/User.js'

// A left join never drops the parent row: parents without a matching joined row
// are still returned, with the joined columns null. So, wherever the innerJoin
// specs assert that a parent is excluded, these specs assert that every parent is
// returned and use a pluck of a joined column (null for non-matching parents) to
// show that the join condition took effect.
describe('Query#leftJoin with through associations', () => {
  context('explicit HasMany through', () => {
    it('sets HasMany property on the model and BelongsToProperty on the associated model', async () => {
      const spotterWithoutBalloon = await BalloonSpotter.create()
      const balloon = await Latex.create()
      const balloonSpotter = await BalloonSpotter.create()
      await BalloonSpotterBalloon.create({ balloonSpotter, balloon })

      const reloaded = await BalloonSpotter.query().leftJoin('balloonSpotterBalloons', 'balloon').all()
      expect(reloaded).toMatchDreamModels([spotterWithoutBalloon, balloonSpotter])

      const plucked = await BalloonSpotter.query()
        .leftJoin('balloonSpotterBalloons', 'balloon')
        .order('id')
        .pluck('id', 'balloon.id')
      expect(plucked).toEqual([
        [spotterWithoutBalloon.id, null],
        [balloonSpotter.id, balloon.id],
      ])
    })
  })

  context('implicit HasMany through', () => {
    it('sets HasMany property and through property on the model and BelongsToProperty on the associated model', async () => {
      const spotterWithoutBalloon = await BalloonSpotter.create()
      const balloon = await Latex.create()
      const balloonSpotter = await BalloonSpotter.create()
      await BalloonSpotterBalloon.create({ balloonSpotter, balloon })

      const reloaded = await BalloonSpotter.query().leftJoin('balloons').all()
      expect(reloaded).toMatchDreamModels([spotterWithoutBalloon, balloonSpotter])

      const plucked = await BalloonSpotter.query().leftJoin('balloons').order('id').pluck('id', 'balloons.id')
      expect(plucked).toEqual([
        [spotterWithoutBalloon.id, null],
        [balloonSpotter.id, balloon.id],
      ])
    })

    context('default scopes', () => {
      let user: User
      let post: Post
      let postComment: PostComment

      beforeEach(async () => {
        user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        post = await Post.create({ user })
        postComment = await PostComment.create({ post, body: 'hello world', deletedAt: DateTime.now() })
      })

      it('applies default scopes to the join model', async () => {
        expect(await User.leftJoin('postComments').first()).toMatchDreamModel(user)
        expect(await User.leftJoin('postComments').pluck('postComments.id')).toEqual([null])
      })

      it('respects removal of all default scopes', async () => {
        expect(await User.removeAllDefaultScopes().leftJoin('postComments').first()).toMatchDreamModel(user)
        expect(await User.removeAllDefaultScopes().leftJoin('postComments').pluck('postComments.id')).toEqual(
          [postComment.id]
        )
      })

      it('respects removal of named default scopes', async () => {
        expect(
          await User.removeDefaultScope('dream:SoftDelete').leftJoin('postComments').first()
        ).toMatchDreamModel(user)
        expect(
          await User.removeDefaultScope('dream:SoftDelete').leftJoin('postComments').pluck('postComments.id')
        ).toEqual([postComment.id])
      })

      context('when the join model is excluded by a default scope', () => {
        it('excludes models joined through that join model', async () => {
          await post.destroy()
          await postComment.undestroy()

          expect(await Post.first()).toBeNull()
          expect(await PostComment.first()).toMatchDreamModel(postComment)
          // the default scope on the model we start from still applies
          expect(await Post.leftJoin('comments').first()).toBeNull()
          // the user is still returned, but nothing is joined through the destroyed post
          expect(await User.leftJoin('postComments').first()).toMatchDreamModel(user)
          expect(await User.leftJoin('postComments').pluck('postComments.id')).toEqual([null])
        })
      })
    })
  })

  it('joins a HasOne through HasOne association', async () => {
    const userWithoutAsset = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id, primary: true })
    const compositionAsset = await CompositionAsset.create({
      compositionId: composition.id,
      primary: true,
    })

    const reloadedUsers = await User.query().leftJoin('mainCompositionAsset').all()
    expect(reloadedUsers).toMatchDreamModels([userWithoutAsset, user])

    const plucked = await User.query()
      .leftJoin('mainCompositionAsset')
      .order('id')
      .pluck('id', 'mainCompositionAsset.id')
    expect(plucked).toEqual([
      [userWithoutAsset.id, null],
      [user.id, compositionAsset.id],
    ])
  })

  it('joins a HasMany through HasMany association', async () => {
    const userWithoutAsset = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id })
    const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })

    const reloadedUsers = await User.query().leftJoin('compositionAssets').all()
    expect(reloadedUsers).toMatchDreamModels([userWithoutAsset, user])

    const plucked = await User.query()
      .leftJoin('compositionAssets')
      .order('id')
      .pluck('id', 'compositionAssets.id')
    expect(plucked).toEqual([
      [userWithoutAsset.id, null],
      [user.id, compositionAsset.id],
    ])
  })

  context('nested through associations', () => {
    it('joins a HasMany through another through association', async () => {
      const userWithoutAudit = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ userId: user.id })
      const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })
      const compositionAssetAudit = await CompositionAssetAudit.create({
        compositionAssetId: compositionAsset.id,
      })

      const reloadedUsers = await User.query().leftJoin('compositionAssetAudits').all()
      expect(reloadedUsers).toMatchDreamModels([userWithoutAudit, user])

      const plucked = await User.query()
        .leftJoin('compositionAssetAudits')
        .order('id')
        .pluck('id', 'compositionAssetAudits.id')
      expect(plucked).toEqual([
        [userWithoutAudit.id, null],
        [user.id, compositionAssetAudit.id],
      ])
    })
  })

  describe('with where clause', () => {
    context('HasOne through HasOne', () => {
      it('joins', async () => {
        const userWithoutAsset = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ userId: user.id, primary: true })
        const compositionAsset = await CompositionAsset.create({
          compositionId: composition.id,
          primary: true,
        })

        const reloadedUsers = await User.query()
          .leftJoin('mainCompositionAsset', { and: { id: compositionAsset.id } })
          .all()
        expect(reloadedUsers).toMatchDreamModels([userWithoutAsset, user])

        const plucked = await User.query()
          .leftJoin('mainCompositionAsset', { and: { id: compositionAsset.id } })
          .order('id')
          .pluck('id', 'mainCompositionAsset.id')
        expect(plucked).toEqual([
          [userWithoutAsset.id, null],
          [user.id, compositionAsset.id],
        ])

        const nonMatching = await User.query()
          .leftJoin('mainCompositionAsset', {
            and: { id: (parseInt(compositionAsset.id.toString()) + 1).toString() },
          })
          .order('id')
          .pluck('id', 'mainCompositionAsset.id')
        expect(nonMatching).toEqual([
          [userWithoutAsset.id, null],
          [user.id, null],
        ])
      })

      context('with a similarity operator', () => {
        let foreignUser: User

        beforeEach(async () => {
          foreignUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const foreignComposition = await Composition.create({
            user: foreignUser,
            primary: true,
          })
          await CompositionAsset.create({
            compositionId: foreignComposition.id,
            primary: true,
            name: 'goodbye',
          })
        })

        // SKIPPED: ops.similarity is silently ignored in leftJoin and-clauses. SimilarityBuilder is
        // constructed from `innerJoinAndStatements` only (src/dream/QueryDriver/Kysely.ts,
        // similarityStatementBuilder), so `leftJoinAndStatements` never reach it and the join
        // condition is dropped. These specs describe the intended behavior; un-skip once fixed.
        it.skip('nulls out joined rows that do not match similarity text', async () => {
          const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
          const composition = await Composition.create({
            userId: user.id,
            primary: true,
          })
          const compositionAsset = await CompositionAsset.create({
            compositionId: composition.id,
            primary: true,
            name: 'hello',
          })

          const reloadedUsers = await User.query()
            .leftJoin('mainCompositionAsset', { and: { name: ops.similarity('hell') } })
            .all()
          expect(reloadedUsers).toMatchDreamModels([foreignUser, user])

          const plucked = await User.query()
            .leftJoin('mainCompositionAsset', { and: { name: ops.similarity('hell') } })
            .order('id')
            .pluck('id', 'mainCompositionAsset.id')
          expect(plucked).toEqual([
            [foreignUser.id, null],
            [user.id, compositionAsset.id],
          ])
        })
      })

      context('with another association after the where clause', () => {
        it('joins', async () => {
          const userWithoutAsset = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
          const composition = await Composition.create({ userId: user.id, primary: true })
          const compositionAsset = await CompositionAsset.create({
            compositionId: composition.id,
            primary: true,
          })

          const reloadedUsers = await User.query()
            .leftJoin('compositions', { and: { id: composition.id } }, 'compositionAssets')
            .all()
          expect(reloadedUsers).toMatchDreamModels([userWithoutAsset, user])

          const plucked = await User.query()
            .leftJoin('compositions', { and: { id: composition.id } }, 'compositionAssets')
            .order('id')
            .pluck('id', 'compositionAssets.id')
          expect(plucked).toEqual([
            [userWithoutAsset.id, null],
            [user.id, compositionAsset.id],
          ])

          const nonMatching = await User.query()
            .leftJoin(
              'compositions',
              { and: { id: (parseInt(composition.id.toString()) + 1).toString() } },
              'compositionAssets'
            )
            .order('id')
            .pluck('id', 'compositionAssets.id')
          expect(nonMatching).toEqual([
            [userWithoutAsset.id, null],
            [user.id, null],
          ])
        })
      })
    })

    context('HasOne through BelongsTo', () => {
      it('joins', async () => {
        const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const otherComposition = await Composition.create({ userId: otherUser.id })
        const otherCompositionAsset = await CompositionAsset.create({ compositionId: otherComposition.id })

        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ userId: user.id })
        const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })

        const reloadedCompositionAssets = await CompositionAsset.query()
          .leftJoin('user', { and: { id: user.id } })
          .all()
        expect(reloadedCompositionAssets).toMatchDreamModels([otherCompositionAsset, compositionAsset])

        const plucked = await CompositionAsset.query()
          .leftJoin('user', { and: { id: user.id } })
          .order('id')
          .pluck('id', 'user.id')
        expect(plucked).toEqual([
          [otherCompositionAsset.id, null],
          [compositionAsset.id, user.id],
        ])

        const nonMatching = await CompositionAsset.query()
          .leftJoin('user', { and: { id: (parseInt(user.id.toString()) + 1).toString() } })
          .order('id')
          .pluck('id', 'user.id')
        expect(nonMatching).toEqual([
          [otherCompositionAsset.id, null],
          [compositionAsset.id, null],
        ])
      })
    })

    context('HasMany through HasMany', () => {
      it('joins a HasMany through HasMany association', async () => {
        const userWithoutAsset = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ userId: user.id })
        const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })

        const reloadedUsers = await User.query()
          .leftJoin('compositionAssets', { and: { id: compositionAsset.id } })
          .all()
        expect(reloadedUsers).toMatchDreamModels([userWithoutAsset, user])

        const plucked = await User.query()
          .leftJoin('compositionAssets', { and: { id: compositionAsset.id } })
          .order('id')
          .pluck('id', 'compositionAssets.id')
        expect(plucked).toEqual([
          [userWithoutAsset.id, null],
          [user.id, compositionAsset.id],
        ])

        const nonMatching = await User.query()
          .leftJoin('compositionAssets', {
            and: { id: (parseInt(compositionAsset.id.toString()) + 1).toString() },
          })
          .order('id')
          .pluck('id', 'compositionAssets.id')
        expect(nonMatching).toEqual([
          [userWithoutAsset.id, null],
          [user.id, null],
        ])
      })
    })

    context('nested through associations', () => {
      it('joins a HasMany through another through association', async () => {
        const userWithoutAudit = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ userId: user.id })
        const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })
        const compositionAssetAudit = await CompositionAssetAudit.create({
          compositionAssetId: compositionAsset.id,
        })

        const reloadedUsers = await User.query()
          .leftJoin('compositionAssetAudits', { and: { id: compositionAssetAudit.id } })
          .all()
        expect(reloadedUsers).toMatchDreamModels([userWithoutAudit, user])

        const plucked = await User.query()
          .leftJoin('compositionAssetAudits', { and: { id: compositionAssetAudit.id } })
          .order('id')
          .pluck('id', 'compositionAssetAudits.id')
        expect(plucked).toEqual([
          [userWithoutAudit.id, null],
          [user.id, compositionAssetAudit.id],
        ])

        const nonMatching = await User.query()
          .leftJoin('compositionAssetAudits', {
            and: { id: (parseInt(compositionAssetAudit.id.toString()) + 1).toString() },
          })
          .order('id')
          .pluck('id', 'compositionAssetAudits.id')
        expect(nonMatching).toEqual([
          [userWithoutAudit.id, null],
          [user.id, null],
        ])
      })
    })
  })

  context('with a where-clause-on-the-through-association', () => {
    context('explicit through', () => {
      context('join models that match the where clause', () => {
        it('are included in the join', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const recentComposition = await Composition.create({ user })

          const compositionAsset = await CompositionAsset.create({
            name: 'Hello',
            composition: recentComposition,
          })

          const reloadedUser = await User.leftJoin('recentCompositions', 'compositionAssets', {
            and: { name: compositionAsset.name },
          }).first()
          expect(reloadedUser).toMatchDreamModel(user)

          const plucked = await User.leftJoin('recentCompositions', 'compositionAssets', {
            and: { name: compositionAsset.name },
          }).pluck('compositionAssets.id')
          expect(plucked).toEqual([compositionAsset.id])
        })

        context('with a deep similarity operator', () => {
          // SKIPPED: ops.similarity is silently ignored in leftJoin and-clauses. SimilarityBuilder is
          // constructed from `innerJoinAndStatements` only (src/dream/QueryDriver/Kysely.ts,
          // similarityStatementBuilder), so `leftJoinAndStatements` never reach it and the join
          // condition is dropped. These specs describe the intended behavior; un-skip once fixed.
          it.skip('joins', async () => {
            const user1 = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
            const composition1 = await Composition.create({ user: user1 })
            const compositionAsset1 = await CompositionAsset.create({
              compositionId: composition1.id,
              primary: true,
            })
            const audit1 = await CompositionAssetAudit.create({
              compositionAsset: compositionAsset1,
              notes: 'Hello',
            })

            const user2 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
            const composition2 = await Composition.create({ user: user2 })
            const compositionAsset2 = await CompositionAsset.create({
              compositionId: composition2.id,
              primary: true,
            })
            await CompositionAssetAudit.create({
              compositionAsset: compositionAsset2,
              notes: 'Goodbye',
            })

            const reloadedUsers = await User.query()
              .leftJoin('compositions', 'compositionAssets', 'compositionAssetAudits', {
                and: { notes: ops.similarity('hallo') },
              })
              .all()
            expect(reloadedUsers).toMatchDreamModels([user1, user2])

            const plucked = await User.query()
              .leftJoin('compositions', 'compositionAssets', 'compositionAssetAudits', {
                and: { notes: ops.similarity('hallo') },
              })
              .order('id')
              .pluck('id', 'compositionAssetAudits.id')
            expect(plucked).toEqual([
              [user1.id, audit1.id],
              [user2.id, null],
            ])
          })

          context('with an association after the conditions', () => {
            // SKIPPED for the same reason as the enclosing similarity spec
            it.skip('joins', async () => {
              const user1 = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
              const composition1 = await Composition.create({ user: user1 })
              const compositionAsset1 = await CompositionAsset.create({
                compositionId: composition1.id,
                primary: true,
                name: 'hello',
              })
              const audit1 = await CompositionAssetAudit.create({
                compositionAsset: compositionAsset1,
                notes: 'Hello',
              })

              const user2 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
              const composition2 = await Composition.create({ user: user2 })
              const compositionAsset2 = await CompositionAsset.create({
                compositionId: composition2.id,
                primary: true,
                name: 'gabye',
              })
              await CompositionAssetAudit.create({
                compositionAsset: compositionAsset2,
                notes: 'Goodbye',
              })

              const reloadedUsers = await User.query()
                .leftJoin(
                  'compositions',
                  'compositionAssets',
                  { and: { name: ops.similarity('hallo') } },
                  'compositionAssetAudits',
                  {
                    and: { notes: ops.similarity('hallo') },
                  }
                )
                .all()
              expect(reloadedUsers).toMatchDreamModels([user1, user2])

              const plucked = await User.query()
                .leftJoin(
                  'compositions',
                  'compositionAssets',
                  { and: { name: ops.similarity('hallo') } },
                  'compositionAssetAudits',
                  {
                    and: { notes: ops.similarity('hallo') },
                  }
                )
                .order('id')
                .pluck('id', 'compositionAssetAudits.id')
              expect(plucked).toEqual([
                [user1.id, audit1.id],
                [user2.id, null],
              ])
            })
          })
        })
      })

      context('join models that DO NOT match the where clause', () => {
        it('are nulled out in the join', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const olderComposition = await Composition.create({
            user,
            createdAt: DateTime.now().minus({ year: 1 }),
          })

          const compositionAsset = await CompositionAsset.create({
            name: 'World',
            composition: olderComposition,
          })

          const reloadedUser = await User.leftJoin('recentCompositions', 'compositionAssets', {
            and: { name: compositionAsset.name },
          }).first()
          expect(reloadedUser).toMatchDreamModel(user)

          const plucked = await User.leftJoin('recentCompositions', 'compositionAssets', {
            and: { name: compositionAsset.name },
          }).pluck('compositionAssets.id')
          expect(plucked).toEqual([null])
        })
      })
    })

    context('implicit through', () => {
      context('join models that match the where clause', () => {
        it('are included in the join', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const recentComposition = await Composition.create({ user })

          const compositionAsset = await CompositionAsset.create({
            name: 'Hello',
            composition: recentComposition,
          })

          const reloadedUser = await User.leftJoin('recentCompositionAssets', {
            and: { name: 'Hello' },
          }).first()
          expect(reloadedUser).toMatchDreamModel(user)

          const plucked = await User.leftJoin('recentCompositionAssets', {
            and: { name: 'Hello' },
          }).pluck('recentCompositionAssets.id')
          expect(plucked).toEqual([compositionAsset.id])
        })

        context('HasMany through a HasMany that HasOne', () => {
          it('are included in the join', async () => {
            const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
            const recentComposition = await Composition.create({ user })

            const compositionAsset = await CompositionAsset.create({
              name: 'Hello',
              composition: recentComposition,
              primary: true,
            })

            const reloadedUser = await User.leftJoin('recentCompositionAssets', {
              and: { name: 'Hello' },
            }).first()
            expect(reloadedUser).toMatchDreamModel(user)

            const plucked = await User.leftJoin('recentCompositionAssets', {
              and: { name: 'Hello' },
            }).pluck('recentCompositionAssets.id')
            expect(plucked).toEqual([compositionAsset.id])
          })
        })
      })

      context('join models that DO NOT match the where clause', () => {
        it('are nulled out in the join', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const olderComposition = await Composition.create({
            user,
            createdAt: DateTime.now().minus({ year: 1 }),
          })

          await CompositionAsset.create({
            name: 'World',
            composition: olderComposition,
          })

          const reloadedUser = await User.leftJoin('recentCompositionAssets', {
            and: { name: 'World' },
          }).first()
          expect(reloadedUser).toMatchDreamModel(user)

          const plucked = await User.leftJoin('recentCompositionAssets', {
            and: { name: 'World' },
          }).pluck('recentCompositionAssets.id')
          expect(plucked).toEqual([null])
        })

        context('HasMany through a HasMany that HasOne', () => {
          it('are nulled out in the join', async () => {
            const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
            const olderComposition = await Composition.create({
              user,
              createdAt: DateTime.now().minus({ year: 1 }),
            })

            await CompositionAsset.create({
              name: 'World',
              composition: olderComposition,
              primary: true,
            })

            const reloadedUser = await User.leftJoin('recentCompositionAssets', {
              and: { name: 'World' },
            }).first()
            expect(reloadedUser).toMatchDreamModel(user)

            const plucked = await User.leftJoin('recentCompositionAssets', {
              and: { name: 'World' },
            }).pluck('recentCompositionAssets.id')
            expect(plucked).toEqual([null])
          })
        })
      })
    })
  })

  context('with a selfAnd clause', () => {
    it('applies conditional to selectively bring in records', async () => {
      const userWithoutPosts = await User.create({
        email: 'fred@fishman',
        password: 'howyadoin',
        featuredPostPosition: 2,
      })
      const user = await User.create({
        email: 'fred@frewd',
        password: 'howyadoin',
        featuredPostPosition: 2,
      })

      // position is automatically set by sortable
      await Post.create({ user, body: 'hello' })
      const post2 = await Post.create({ user, body: 'world' })

      const plucked = await User.query()
        .leftJoin('featuredPost')
        .order('id')
        .pluck('id', 'featuredPost.id', 'featuredPost.body')
      expect(plucked).toEqual([
        [userWithoutPosts.id, null, null],
        [user.id, post2.id, 'world'],
      ])
    })

    context('with an explicit alias', () => {
      it('references the explicit alias in the selfAnd condition', async () => {
        const userWithoutPosts = await User.create({
          email: 'fred@fishman',
          password: 'howyadoin',
          featuredPostPosition: 2,
        })
        const user = await User.create({
          email: 'fred@frewd',
          password: 'howyadoin',
          featuredPostPosition: 2,
        })

        // position is automatically set by sortable
        await Post.create({ user, body: 'hello' })
        const post2 = await Post.create({ user, body: 'world' })

        const plucked = await User.query()
          .leftJoin('featuredPost as fp')
          .order('id')
          .pluck('id', 'fp.id', 'fp.body')
        expect(plucked).toEqual([
          [userWithoutPosts.id, null, null],
          [user.id, post2.id, 'world'],
        ])
      })
    })

    context('with an explicit alias on an association bridging the selfAnd association', () => {
      it('applies the selfAnd condition to the intermediate join', async () => {
        const userWithoutPosts = await User.create({
          email: 'fred@fishman',
          password: 'howyadoin',
          featuredPostPosition: 2,
        })
        const user = await User.create({
          email: 'fred@frewd',
          password: 'howyadoin',
          featuredPostPosition: 2,
        })

        // position is automatically set by sortable
        const post1 = await Post.create({ user, body: 'hello' })
        await Rating.create({ user, rateable: post1, rating: 3 })
        const post2 = await Post.create({ user, body: 'world' })
        const rating2 = await Rating.create({ user, rateable: post2, rating: 5 })

        const plucked = await User.query().leftJoin('featuredRatings as fr').order('id').pluck('id', 'fr.id')
        expect(plucked).toEqual([
          [userWithoutPosts.id, null],
          [user.id, rating2.id],
        ])
      })
    })

    context('when the selfAnd is declared on the join association', () => {
      it('applies conditional to selectively bring in records', async () => {
        const user = await User.create({
          email: 'fred@frewd',
          password: 'howyadoin',
          targetRating: 7,
        })
        const post1 = await Post.create({ user })
        await Rating.create({ user, rateable: post1, rating: 3 })
        const rating1b = await Rating.create({ user, rateable: post1, rating: 7 })
        const post2 = await Post.create({ user })
        const rating2a = await Rating.create({ user, rateable: post2, rating: 7 })
        await Rating.create({ user, rateable: post2, rating: 5 })

        const plucked = await User.query()
          .leftJoin('ratingsThroughPostsThatMatchUserTargetRating')
          .pluck(
            'ratingsThroughPostsThatMatchUserTargetRating.id',
            'ratingsThroughPostsThatMatchUserTargetRating.rating'
          )
        expect(plucked).toHaveLength(2)
        expect(plucked).toEqual(
          expect.arrayContaining([
            [rating1b.id, 7],
            [rating2a.id, 7],
          ])
        )
      })

      context('with an explicit alias', () => {
        it('references the explicit alias in the selfAnd condition', async () => {
          const user = await User.create({
            email: 'fred@frewd',
            password: 'howyadoin',
            targetRating: 7,
          })
          const post1 = await Post.create({ user })
          await Rating.create({ user, rateable: post1, rating: 3 })
          const rating1b = await Rating.create({ user, rateable: post1, rating: 7 })

          const plucked = await User.query()
            .leftJoin('ratingsThroughPostsThatMatchUserTargetRating as r')
            .pluck('r.id', 'r.rating')
          expect(plucked).toEqual([[rating1b.id, 7]])
        })
      })
    })
  })

  context('with a missing association', () => {
    it('throws MissingThroughAssociation', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const query = User.query().leftJoin('nonExtantCompositionAssets1').first()

      await expect(query).rejects.toThrow(MissingThroughAssociation)
    })
  })

  context('with a missing source', () => {
    it('throws MissingThroughAssociationSource', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const query = User.query().leftJoin('nonExtantCompositionAssets2').first()

      await expect(query).rejects.toThrow(MissingThroughAssociationSource)
    })
  })

  // leftJoin shares the innerJoinDreamClasses bookkeeping with innerJoin
  it('adds explicitly joined Dream classes to innerJoinDreamClasses', () => {
    const query = BalloonSpotter.query().leftJoin('balloonSpotterBalloons', 'balloon')
    expect(query['innerJoinDreamClasses']).toEqual([BalloonSpotterBalloon, Balloon])
  })

  it('adds implicitly joined Dream classes to innerJoinDreamClasses', () => {
    const query = BalloonSpotter.query().leftJoin('balloons')
    expect(query['innerJoinDreamClasses']).toEqual([BalloonSpotterBalloon, Balloon])
  })

  context('options on a through association whose source is itself a through association', () => {
    // Each A is reachable through its own OtherModel, so the left join yields one row per
    // OtherModel: a null where that OtherModel's A is excluded by the association's condition
    let myModel: ThroughMyModel

    beforeEach(async () => {
      myModel = await ThroughMyModel.create({ name: 'My model' })
    })

    context('and', () => {
      it('applies the and clause when joining the association directly', async () => {
        await createAReachableFrom(myModel, 'Beautiful A')
        await createAReachableFrom(myModel, 'Plain A')

        const names = await ThroughMyModel.query().leftJoin('myAndA').pluck('myAndA.name')
        expect(names).toHaveLength(2)
        expect(names).toEqual(expect.arrayContaining(['Beautiful A', null]))
      })

      it('applies the and clause when bridged by a further through association', async () => {
        const beautifulA = await createAReachableFrom(myModel, 'Beautiful A')
        const plainA = await createAReachableFrom(myModel, 'Plain A')
        await ThroughB.create({ name: 'B of beautiful A', a: beautifulA })
        await ThroughB.create({ name: 'B of plain A', a: plainA })

        const names = await ThroughMyModel.query().leftJoin('myAndB').pluck('myAndB.name')
        expect(names).toHaveLength(2)
        expect(names).toEqual(expect.arrayContaining(['B of beautiful A', null]))
      })

      context('with an explicit alias', () => {
        it('applies the and clause when joining the association directly', async () => {
          await createAReachableFrom(myModel, 'Beautiful A')
          await createAReachableFrom(myModel, 'Plain A')

          const names = await ThroughMyModel.query().leftJoin('myAndA as maa').pluck('maa.name')
          expect(names).toHaveLength(2)
          expect(names).toEqual(expect.arrayContaining(['Beautiful A', null]))
        })

        it('applies the and clause when bridged by a further through association', async () => {
          const beautifulA = await createAReachableFrom(myModel, 'Beautiful A')
          const plainA = await createAReachableFrom(myModel, 'Plain A')
          await ThroughB.create({ name: 'B of beautiful A', a: beautifulA })
          await ThroughB.create({ name: 'B of plain A', a: plainA })

          const names = await ThroughMyModel.query().leftJoin('myAndB as mab').pluck('mab.name')
          expect(names).toHaveLength(2)
          expect(names).toEqual(expect.arrayContaining(['B of beautiful A', null]))
        })
      })
    })

    context('andAny', () => {
      it('applies the andAny clause when joining the association directly', async () => {
        await createAReachableFrom(myModel, 'Beautiful A')
        await createAReachableFrom(myModel, 'Gorgeous A')
        await createAReachableFrom(myModel, 'Plain A')

        const names = await ThroughMyModel.query().leftJoin('myAndAnyA').pluck('myAndAnyA.name')
        expect(names).toHaveLength(3)
        expect(names).toEqual(expect.arrayContaining(['Beautiful A', 'Gorgeous A', null]))
      })

      it('applies the andAny clause when bridged by a further through association', async () => {
        const beautifulA = await createAReachableFrom(myModel, 'Beautiful A')
        const gorgeousA = await createAReachableFrom(myModel, 'Gorgeous A')
        const plainA = await createAReachableFrom(myModel, 'Plain A')
        await ThroughB.create({ name: 'B of beautiful A', a: beautifulA })
        await ThroughB.create({ name: 'B of gorgeous A', a: gorgeousA })
        await ThroughB.create({ name: 'B of plain A', a: plainA })

        const names = await ThroughMyModel.query().leftJoin('myAndAnyB').pluck('myAndAnyB.name')
        expect(names).toHaveLength(3)
        expect(names).toEqual(expect.arrayContaining(['B of beautiful A', 'B of gorgeous A', null]))
      })
    })

    context('andNot', () => {
      it('applies the andNot clause when joining the association directly', async () => {
        await createAReachableFrom(myModel, 'Forgettable A')
        await createAReachableFrom(myModel, 'Plain A')

        const names = await ThroughMyModel.query().leftJoin('myAndNotA').pluck('myAndNotA.name')
        expect(names).toHaveLength(2)
        expect(names).toEqual(expect.arrayContaining(['Plain A', null]))
      })

      it('applies the andNot clause when bridged by a further through association', async () => {
        const forgettableA = await createAReachableFrom(myModel, 'Forgettable A')
        const plainA = await createAReachableFrom(myModel, 'Plain A')
        await ThroughB.create({ name: 'B of forgettable A', a: forgettableA })
        await ThroughB.create({ name: 'B of plain A', a: plainA })

        const names = await ThroughMyModel.query().leftJoin('myAndNotB').pluck('myAndNotB.name')
        expect(names).toHaveLength(2)
        expect(names).toEqual(expect.arrayContaining(['B of plain A', null]))
      })
    })

    context('selfAnd', () => {
      it('applies the selfAnd clause when joining the association directly', async () => {
        await createAReachableFrom(myModel, 'My model')
        await createAReachableFrom(myModel, 'Plain A')

        const names = await ThroughMyModel.query().leftJoin('mySelfAndA').pluck('mySelfAndA.name')
        expect(names).toHaveLength(2)
        expect(names).toEqual(expect.arrayContaining(['My model', null]))
      })

      it('applies the selfAnd clause when bridged by a further through association', async () => {
        const matchingA = await createAReachableFrom(myModel, 'My model')
        const plainA = await createAReachableFrom(myModel, 'Plain A')
        await ThroughB.create({ name: 'B of matching A', a: matchingA })
        await ThroughB.create({ name: 'B of plain A', a: plainA })

        const names = await ThroughMyModel.query().leftJoin('mySelfAndB').pluck('mySelfAndB.name')
        expect(names).toHaveLength(2)
        expect(names).toEqual(expect.arrayContaining(['B of matching A', null]))
      })

      context('with an explicit alias', () => {
        it('applies the selfAnd clause when joining the association directly', async () => {
          await createAReachableFrom(myModel, 'My model')
          await createAReachableFrom(myModel, 'Plain A')

          const names = await ThroughMyModel.query().leftJoin('mySelfAndA as msa').pluck('msa.name')
          expect(names).toHaveLength(2)
          expect(names).toEqual(expect.arrayContaining(['My model', null]))
        })

        it('applies the selfAnd clause when bridged by a further through association', async () => {
          const matchingA = await createAReachableFrom(myModel, 'My model')
          const plainA = await createAReachableFrom(myModel, 'Plain A')
          await ThroughB.create({ name: 'B of matching A', a: matchingA })
          await ThroughB.create({ name: 'B of plain A', a: plainA })

          const names = await ThroughMyModel.query().leftJoin('mySelfAndB as msb').pluck('msb.name')
          expect(names).toHaveLength(2)
          expect(names).toEqual(expect.arrayContaining(['B of matching A', null]))
        })
      })
    })

    context('selfAndNot', () => {
      it('applies the selfAndNot clause when joining the association directly', async () => {
        await createAReachableFrom(myModel, 'My model')
        await createAReachableFrom(myModel, 'Plain A')

        const names = await ThroughMyModel.query().leftJoin('mySelfAndNotA').pluck('mySelfAndNotA.name')
        expect(names).toHaveLength(2)
        expect(names).toEqual(expect.arrayContaining(['Plain A', null]))
      })

      it('applies the selfAndNot clause when bridged by a further through association', async () => {
        const matchingA = await createAReachableFrom(myModel, 'My model')
        const plainA = await createAReachableFrom(myModel, 'Plain A')
        await ThroughB.create({ name: 'B of matching A', a: matchingA })
        await ThroughB.create({ name: 'B of plain A', a: plainA })

        const names = await ThroughMyModel.query().leftJoin('mySelfAndNotB').pluck('mySelfAndNotB.name')
        expect(names).toHaveLength(2)
        expect(names).toEqual(expect.arrayContaining(['B of plain A', null]))
      })
    })

    context('order', () => {
      it('applies the order clause when joining the association directly', async () => {
        await createAReachableFrom(myModel, 'c')
        await createAReachableFrom(myModel, 'a')
        await createAReachableFrom(myModel, 'b')

        const names = await ThroughMyModel.query().leftJoin('myOrderedA').pluck('myOrderedA.name')
        expect(names).toEqual(['a', 'b', 'c'])
      })

      it('applies the order clause when bridged by a further through association', async () => {
        const cA = await createAReachableFrom(myModel, 'c')
        const aA = await createAReachableFrom(myModel, 'a')
        const bA = await createAReachableFrom(myModel, 'b')
        await ThroughB.create({ name: 'B of c', a: cA })
        await ThroughB.create({ name: 'B of a', a: aA })
        await ThroughB.create({ name: 'B of b', a: bA })

        const names = await ThroughMyModel.query().leftJoin('myOrderedB').pluck('myOrderedB.name')
        expect(names).toEqual(['B of a', 'B of b', 'B of c'])
      })
    })

    context('distinct', () => {
      it('applies the distinct clause when joining the association directly', async () => {
        const a = await createAReachableFrom(myModel, 'Shared A')
        await attachAToNewOtherModel(myModel, a)

        const duplicatedIds = await ThroughMyModel.query().leftJoin('myA').pluck('myA.id')
        expect(duplicatedIds).toEqual([a.id, a.id])

        const ids = await ThroughMyModel.query().leftJoin('myDistinctA').pluck('myDistinctA.id')
        expect(ids).toEqual([a.id])
      })

      it('applies the distinct clause when bridged by a further through association', async () => {
        const a = await createAReachableFrom(myModel, 'Shared A')
        await attachAToNewOtherModel(myModel, a)
        const b = await ThroughB.create({ name: 'B of shared A', a })

        const duplicatedIds = await ThroughMyModel.query().leftJoin('myB').pluck('myB.id')
        expect(duplicatedIds).toEqual([b.id, b.id])

        const ids = await ThroughMyModel.query().leftJoin('myDistinctB').pluck('myDistinctB.id')
        expect(ids).toEqual([b.id])
      })
    })
  })
})

async function createAReachableFrom(myModel: ThroughMyModel, name: string): Promise<ThroughA> {
  const otherModel = await ThroughOtherModel.create({ name: 'Other model', myModel })
  const a = await ThroughA.create({ name })
  await ThroughAToOtherModelJoinModel.create({ a, otherModel })
  return a
}

async function attachAToNewOtherModel(myModel: ThroughMyModel, a: ThroughA): Promise<void> {
  const otherModel = await ThroughOtherModel.create({ name: 'Other model', myModel })
  await ThroughAToOtherModelJoinModel.create({ a, otherModel })
}
