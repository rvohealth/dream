import Decorators from '../../../src/decorators/Decorators.js'
import Query from '../../../src/dream/Query.js'
import Rating from './Rating.js'

const deco = new Decorators<typeof NonNullRating>()

export default class NonNullRating extends Rating {
  @deco.Scope({ default: true })
  public static nonNullBodies(query: Query<Rating>) {
    return query.whereNot({ body: null })
  }
}
