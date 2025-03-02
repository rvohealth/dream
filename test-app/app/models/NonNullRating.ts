import { Decorators, Query, Scope } from '../../../src'
import { Type } from '../../../src/dream/types'
import Rating from './Rating'

const Decorator = new Decorators<Type<typeof NonNullRating>>()

export default class NonNullRating extends Rating {
  @Scope({ default: true })
  public static nonNullBodies(query: Query<Rating>) {
    return query.whereNot({ body: null })
  }
}
