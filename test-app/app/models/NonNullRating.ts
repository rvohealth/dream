import { Query, Scope } from '../../../src'
import Rating from './Rating'

// const Deco = new Decorators<InstanceType<typeof NonNullRating>>()

export default class NonNullRating extends Rating {
  @Scope({ default: true })
  public static nonNullBodies(query: Query<Rating>) {
    return query.whereNot({ body: null })
  }
}
