export interface DecoratorContext {
  kind: 'class' | 'field' | 'method' | 'getter'
  name: string
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
