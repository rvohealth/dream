import Decorators from '../../../src/decorators/Decorators.js'
import Query from '../../../src/dream/Query.js'
import ops from '../../../src/ops/index.js'
import Rating from './Rating.js'

const deco = new Decorators<typeof NonNullRating>()

export default class NonNullRating extends Rating {
  @deco.Scope({ default: true })
  public static nonNullBodies(query: Query<Rating>) {
    return query.whereNot({ body: null })
  }

  // Contrived whereAny default scope (a tautology, so it never filters rows) that
  // exists purely so specs can prove whereAny default scopes cross into association
  // loads the same way whereNot/where default scopes do.
  @deco.Scope({ default: true })
  public static anyRating(query: Query<Rating>) {
    return query.whereAny([{ rating: ops.not.equal(null) }, { rating: ops.equal(null) }])
  }
}
