import NonNullRating from '../../../../test-app/app/models/NonNullRating.js'
import Post from '../../../../test-app/app/models/Post.js'
import User from '../../../../test-app/app/models/User.js'

describe('default scopes on association loads', () => {
  // NonNullRating carries two default scopes:
  //   - nonNullBodies:  whereNot({ body: null })
  //   - anyRating:      whereAny([{ rating: not null }, { rating: null }])
  // Post#nonNullRatings targets NonNullRating without bypassing either scope, so both
  // clause families must cross into the association join. Prior to this fix only the
  // where(...) clause family was applied on association loads, silently dropping
  // whereNot(...)/whereAny(...) default scopes and leaking rows the app intended to hide.
  context('whereNot / whereAny default scopes', () => {
    it('applies whereNot conditions to a left join', () => {
      const sql = Post.query().leftJoin('nonNullRatings').toKysely('select').compile().sql
      expect(sql).toContain('not ("non_null_ratings"."body" is null)')
    })

    it('applies whereAny conditions to a left join', () => {
      const sql = Post.query().leftJoin('nonNullRatings').toKysely('select').compile().sql
      expect(sql).toContain(
        '("non_null_ratings"."rating" is not null or "non_null_ratings"."rating" is null)'
      )
    })

    it('applies whereNot conditions to an inner join', () => {
      const sql = Post.query().innerJoin('nonNullRatings').toKysely('select').compile().sql
      expect(sql).toContain('not ("non_null_ratings"."body" is null)')
    })

    it('applies whereAny conditions to an inner join', () => {
      const sql = Post.query().innerJoin('nonNullRatings').toKysely('select').compile().sql
      expect(sql).toContain(
        '("non_null_ratings"."rating" is not null or "non_null_ratings"."rating" is null)'
      )
    })

    it('filters preloaded associations by the whereNot default scope', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const post = await Post.create({ user })
      const visible = await NonNullRating.create({ user, rateable: post, body: 'visible' })
      // A null body is hidden by the nonNullBodies default scope. Before the fix this row
      // leaked through the association load; now it is excluded, matching direct queries.
      await NonNullRating.create({ user, rateable: post, body: null })

      const reloaded = await Post.preload('nonNullRatings').findOrFail(post.id)
      expect(reloaded.nonNullRatings).toMatchDreamModels([visible])
    })
  })

  context('where-based default scopes (SoftDelete)', () => {
    it('continues to apply where default scopes to association joins', () => {
      const sql = User.query().leftJoin('pets').toKysely('select').compile().sql
      expect(sql).toContain('"pets"."deleted_at" is null')
    })
  })
})
