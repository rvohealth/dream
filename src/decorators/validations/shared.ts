export default interface ValidationStatement {
  type: ValidationType
  column: string
  options?: {
    presence?: {}
    numericality?: {}
    contains?: {
      value: string | RegExp
    }
    length?: {
      min: number
      max?: number
    }
  }
}

export type ValidationType = 'presence' | 'numericality' | 'contains' | 'length' | 'requiredBelongsTo'
