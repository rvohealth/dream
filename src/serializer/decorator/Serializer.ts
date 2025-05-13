export default function Serializer(): any {
  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: unknown) {
      console.debug({ key, name: (this as any)?.name, this: (this as any)?.constructor?.name })
    })
  }
}
