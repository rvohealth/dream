import DreamSerializer from '../..'
import { AssociationStatement, DreamSerializerClassCB, RendersOneOrManyOpts } from './shared'

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
 *   @HasOne(() => Settings)
 *   public settings: Settings
 * }
 *
 * class Post extends ApplicationModel {
 *   @BelongsTo(() => User)
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
  serializerClassCB: DreamSerializerClassCB | RendersManyOpts | null = null,
  opts?: RendersManyOpts
): any {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function (target: any, key: string, def: any) {
    const serializerClass: typeof DreamSerializer = target.constructor
    opts ||= (serializerClassCB || {}) as RendersManyOpts
    if (typeof serializerClassCB !== 'function') {
      serializerClassCB = null
    }

    if (!Object.getOwnPropertyDescriptor(serializerClass, 'associationStatements'))
      serializerClass.associationStatements = [
        ...(serializerClass.associationStatements || []),
      ] as AssociationStatement[]

    serializerClass.associationStatements = [
      ...serializerClass.associationStatements,
      {
        type: 'RendersMany',
        field: key,
        optional: opts.optional || false,
        serializerClassCB,
        serializerKey: opts.serializer,
        source: opts.source || key,
        through: opts.through || null,
        path: opts.path || null,
        exportedAs: opts.exportedAs || null,
      } as AssociationStatement,
    ]
  }
}

export interface RendersManyOpts extends RendersOneOrManyOpts {}
