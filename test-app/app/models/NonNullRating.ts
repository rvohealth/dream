import { Decorators, Query } from '../../../src/index.js'
import Rating from './Rating.js'

const deco = new Decorators<InstanceType<typeof NonNullRating>>()

export default class NonNullRating extends Rating {
  @deco.Scope({ default: true })
  public static nonNullBodies(query: Query<Rating>) {
    return query.whereNot({ body: null })
  }
}
