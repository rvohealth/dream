export default interface ValidationStatement {
  type: ValidationType
  column: string
}

export type ValidationType = 'presence'
