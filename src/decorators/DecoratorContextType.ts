export interface DecoratorContext {
  kind: 'class' | 'field' | 'method'
  name: 'positionAlpha'
  static: boolean
  private: boolean
  access: {
    has: () => unknown
    get: () => unknown
    set: () => unknown
  }
  metadata: unknown
  addInitializer: (arg: (this: any) => void) => void
}
