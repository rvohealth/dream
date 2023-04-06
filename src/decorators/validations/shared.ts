export default interface ValidationStatement {
  type: ValidationType
  column: string
  options?: {
    presence?: {}
    contains?: {
      value: string | RegExp
    }
  }
}

export type ValidationType = 'presence' | 'contains'
