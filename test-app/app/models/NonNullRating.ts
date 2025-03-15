import { Query, Scope } from '../../../src/index.js'
import Rating from './Rating.js'

// const Deco = new Decorators<InstanceType<typeof NonNullRating>>()

export default class NonNullRating extends Rating {
  @Scope({ default: true })
  public static nonNullBodies(query: Query<Rating>) {
    return query.whereNot({ body: null })
  }
}
