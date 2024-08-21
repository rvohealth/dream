"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOFT_DELETE_SCOPE_NAME = void 0;
const scope_1 = __importDefault(require("./scope"));
exports.SOFT_DELETE_SCOPE_NAME = 'dream:SoftDelete';
/**
 * Instructs the model to set a timestamp when deleting,
 * rather than actually removing the record from the
 * database.
 *
 * By default, the SoftDelete decorator will expect a
 * `deletedAt` field to be set on your model, pointing
 * to a `timestamp` field in the database, like so:
 *
 * ```ts
 * export async function up(db: Kysely<any>): Promise<void> {
 *   await db.schema
 *     .createTable('posts')
 *     .addColumn('id', 'bigserial', col => col.primaryKey())
 *     .addColumn('deleted_at', 'timestamp', col => col.defaultTo(null))
 *     .addColumn('created_at', 'timestamp', col => col.notNull())
 *     .addColumn('updated_at', 'timestamp', col => col.notNull())
 *     .execute()
 * }
 *
 * @SoftDelete()
 * class Post extends ApplicationModel {}
 * ```
 *
 * If you would like to use a different column to hold the
 * deleted status, you can specify a custom column in your model,
 * like so:
 *
 * @SoftDelete()
 * class Post extends ApplicationModel {
 *   public get deletedAtField() {
 *     return 'customDatetimeField' as const
 *   }
 * }
 */
function SoftDelete() {
    return function (target) {
        const t = target;
        t['softDelete'] = true;
        target[exports.SOFT_DELETE_SCOPE_NAME] = function (query) {
            return query.where({ [t.prototype.deletedAtField]: null });
        };
        (0, scope_1.default)({ default: true })(target, exports.SOFT_DELETE_SCOPE_NAME);
    };
}
exports.default = SoftDelete;
