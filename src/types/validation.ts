export interface ValidationStatement {
  type: ValidationType
  column: string
  options?: {
    presence?: object
    numericality?: {
      max?: number
      min?: number
    }
    contains?: {
      value: string | RegExp
    }
    length?: {
      min: number
      max?: number
    }
  }
}

/**
 * The validations a model runs on `save` and `isValid`. `presence`,
 * `numericality`, `contains` and `length` are declared with
 * `@deco.Validates`; the others are registered by a declaration:
 * `requiredBelongsTo` by a `@deco.BelongsTo` that is not `optional`, and
 * `declaredShape` by `@deco.JSON` and `@deco.Encrypted`, which check that the
 * value the record would store matches the declared shape.
 */
export type ValidationType =
  | 'presence'
  | 'numericality'
  | 'contains'
  | 'length'
  | 'requiredBelongsTo'
  | 'declaredShape'
