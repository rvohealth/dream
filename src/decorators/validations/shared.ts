export default interface ValidationStatement {
  type: ValidationType
  column: string
  options?: {
    presence?: {}
    contains?: {
      value: string | RegExp
    }
    length?: {
      min: number
      max?: number
    }
  }
}

export type ValidationType = 'presence' | 'contains' | 'length'
