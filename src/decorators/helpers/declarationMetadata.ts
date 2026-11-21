import { DecoratorContext } from '../DecoratorContextType.js'

/**
 * Records, under `key` on the class's decorator metadata, that the decorated
 * member was declared on the class being defined, so a class decorator such
 * as `STI()` can tell what that class itself declares.
 *
 * The record is an own property of the class's metadata, so a class sees
 * only its own declarations, never those it inherits.
 */
export function markDeclarationInMetadata(context: DecoratorContext, key: symbol) {
  const metadata = context.metadata as Record<PropertyKey, string[]> | undefined
  if (!metadata) return

  Object.defineProperty(metadata, key, {
    configurable: true,
    value: [...declarationNamesFromMetadata(metadata, key), context.name],
  })
}

/**
 * The names of the members recorded under `key` by `markDeclarationInMetadata`
 * for the class whose decorator metadata is `metadata`.
 */
export function declarationNamesFromMetadata(metadata: unknown, key: symbol): string[] {
  if (!metadata) return []

  return (
    (Object.getOwnPropertyDescriptor(metadata as Record<PropertyKey, string[]>, key)?.value as
      | string[]
      | undefined) || []
  )
}
