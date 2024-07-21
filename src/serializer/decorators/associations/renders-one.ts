import DreamSerializer from '../..'
import { AssociationStatement, DreamSerializerClassCB, RendersOneOrManyOpts } from './shared'

/**
 * Establishes a One to One relationship between
 * the base serializer and the child serializer
 *
 * This relationship is similar to a RendersMany relationship,
 * except that it will only render one item. It is generally
 * used to correspond with HasOne and BelongsTo associations
 * on the models being driven through the serializer.
 *
 * If no argument is provided to RendersOne, it will infer the serializer
 * by looking to the default serializer of the model
 *
 * ```ts
 * class User extends ApplicationModel {
 *   @HasOne(() => Settings)
 *   public settings: Settings
 * }
 *
 * class Settings extends ApplicationModel {
 *   @BelongsTo(() => User)
 *   public user: User
 * }
 *
 * class UserSerializer {
 *   @RendersOne()
 *   public settings: Settings
 * }
 * ```
 *
 * An explicit serializer can also be provided:
 *
 * ```ts
 * class UserSerializer {
 *   @RendersOne(() => SettingsSummarySerializer)
 *   public settings: Settings
 * }
 * ```
 */
export default function RendersOne(
  serializerClassCB: DreamSerializerClassCB | RendersOneOpts | null = null,
  opts?: RendersOneOpts
): any {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function (target: any, key: string, def: any) {
    const serializerClass: typeof DreamSerializer = target.constructor
    opts ||= (serializerClassCB || {}) as RendersOneOpts
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
        type: 'RendersOne',
        field: key,
        flatten: opts.flatten || false,
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

export interface RendersOneOpts extends RendersOneOrManyOpts {
  flatten?: boolean
}
