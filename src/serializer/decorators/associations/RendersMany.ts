import DreamSerializer from '../..'
import { DecoratorContext } from '../../../decorators/DecoratorContextType'
import { SerializableClassOrClasses } from '../../../dream/types'
import { DreamSerializerAssociationStatement, isSerializable, RendersOneOrManyOpts } from './shared'

/**
 * Establishes a One to Many relationship between
 * the base serializer and the child serializer
 *
 * This relationship is similar to a RendersOne relationship,
 * except that it will an array of serialized records. It is generally
 * used to correspond with a HasMany association
 * on the models being driven through the serializer.
 *
 * If no argument is provided to RendersMany, it will infer the serializer
 * by looking to the default serializer of the model
 *
 * ```ts
 * class User extends ApplicationModel {
 *   @User.HasOne('Settings')
 *   public settings: Settings
 * }
 *
 * class Post extends ApplicationModel {
 *   @Post.BelongsTo('User')
 *   public user: User
 * }
 *
 * class UserSerializer {
 *   @RendersMany()
 *   public posts: Post[]
 * }
 * ```
 *
 * An explicit serializer can also be provided:
 *
 * ```ts
 * class UserSerializer {
 *   @RendersMany(() => PostSummarySerializer)
 *   public posts: Post[]
 * }
 * ```
 */
export default function RendersMany(
  serializableClassOrClasses: SerializableClassOrClasses | RendersManyOpts | null = null,
  opts?: RendersManyOpts
): any {
  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: DreamSerializer) {
      const target = this
      const serializerClass: typeof DreamSerializer = target.constructor as typeof DreamSerializer
      if (!serializerClass['globallyInitializingDecorators']) return

      if (isSerializable(serializableClassOrClasses)) {
        opts ||= {} as RendersManyOpts
      } else {
        opts = (serializableClassOrClasses || {}) as RendersManyOpts
        serializableClassOrClasses = null
      }

      serializerClass.associationStatements = [
        ...(serializerClass.associationStatements || []),
        {
          type: 'RendersMany',
          field: key,
          optional: opts.optional || false,
          dreamOrSerializerClass: serializableClassOrClasses,
          serializerKey: opts.serializerKey,
          source: opts.source || key,
          through: opts.through || null,
          path: opts.path || null,
          exportedAs: opts.exportedAs || null,
        } as DreamSerializerAssociationStatement,
      ]
    })

    return function (this: DreamSerializer) {
      return (this as any)[key]
    }
  }
}

export type RendersManyOpts = RendersOneOrManyOpts
