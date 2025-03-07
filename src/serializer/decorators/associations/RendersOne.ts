import DreamSerializer from '../../index.js'
import { DecoratorContext } from '../../../decorators/DecoratorContextType.js'
import { SerializableClassOrClasses } from '../../../dream/types.js'
import { DreamSerializerAssociationStatement, isSerializable, RendersOneOrManyOpts } from './shared.js'

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
 *   @User.HasOne('Settings')
 *   public settings: Settings
 * }
 *
 * class Settings extends ApplicationModel {
 *   @Settings.BelongsTo('User')
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
 *
 * @param opts.flatten - whether or not to flatten the association's attributes into this serializer when rendering. Defaults to false.
 */
export default function RendersOne(
  serializableClassOrClasses: SerializableClassOrClasses | RendersOneOpts | null = null,
  opts?: RendersOneOpts
): any {
  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: DreamSerializer) {
      const target = this
      const serializerClass: typeof DreamSerializer = target.constructor as typeof DreamSerializer
      if (!serializerClass['globallyInitializingDecorators']) {
        delete (this as any)[key]
        return
      }

      if (isSerializable(serializableClassOrClasses)) {
        opts ||= {} as RendersOneOpts
      } else {
        opts = (serializableClassOrClasses || {}) as RendersOneOpts
        serializableClassOrClasses = null
      }

      serializerClass.associationStatements = [
        ...(serializerClass.associationStatements || []),
        {
          type: 'RendersOne',
          field: key,
          flatten: opts.flatten || false,
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

    // return function (this: DreamSerializer) {
    //   return (this as any)[key]
    // }
  }
}

export interface RendersOneOpts extends RendersOneOrManyOpts {
  flatten?: boolean
}
