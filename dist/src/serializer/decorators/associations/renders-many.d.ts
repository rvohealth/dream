import { SerializableClassOrClasses } from '../../../dream/types';
import { RendersOneOrManyOpts } from './shared';
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
export default function RendersMany(serializableClassOrClasses?: SerializableClassOrClasses | RendersManyOpts | null, opts?: RendersManyOpts): any;
export interface RendersManyOpts extends RendersOneOrManyOpts {
}
