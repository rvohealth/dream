"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("./shared");
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
 * @param opts.nullable - whether or not this association is nullable. Defaults to false
 */
function RendersOne(serializableClassOrClasses = null, opts) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return function (target, key, def) {
        const serializerClass = target.constructor;
        if ((0, shared_1.isSerializable)(serializableClassOrClasses)) {
            opts ||= {};
        }
        else {
            opts = (serializableClassOrClasses || {});
            serializableClassOrClasses = null;
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
                nullable: opts.nullable || false,
            },
        ];
    };
}
exports.default = RendersOne;
