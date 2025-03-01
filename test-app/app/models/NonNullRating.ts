import { Decorators, Query, Scope } from '../../../src'
import Rating from './Rating'

const Decorator = new Decorators<NonNullRating>()

export default class NonNullRating extends Rating {
  @Scope({ default: true })
  public static nonNullBodies(query: Query<Rating>) {
    return query.whereNot({ body: null })
  }
}
