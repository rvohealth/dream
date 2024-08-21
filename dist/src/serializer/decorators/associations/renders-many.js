"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("./shared");
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
function RendersMany(serializableClassOrClasses = null, opts) {
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
                type: 'RendersMany',
                field: key,
                optional: opts.optional || false,
                dreamOrSerializerClass: serializableClassOrClasses,
                serializerKey: opts.serializerKey,
                source: opts.source || key,
                through: opts.through || null,
                path: opts.path || null,
                exportedAs: opts.exportedAs || null,
            },
        ];
    };
}
exports.default = RendersMany;
