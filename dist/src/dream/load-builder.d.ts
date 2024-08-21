import { PassthroughWhere } from '../decorators/associations/shared';
import Dream from '../dream';
import DreamTransaction from './transaction';
import { PassthroughColumnNames, VariadicLoadArgs } from './types';
export default class LoadBuilder<DreamInstance extends Dream> {
    private dream;
    private dreamTransaction;
    private query;
    /**
     * An intermediate class on the way to executing a load
     * query. this can be accessed on an instance of a dream
     * model by using the `#load` method:
     *
     * ```ts
     * const user = await User.firstOrFail()
     * await user.load('settings').execute()
     * ```
     */
    constructor(dream: Dream, txn?: DreamTransaction<any>);
    passthrough<I extends LoadBuilder<DreamInstance>, PassthroughColumns extends PassthroughColumnNames<DreamInstance>>(this: I, passthroughWhereStatement: PassthroughWhere<PassthroughColumns>): I;
    /**
     * Attaches a load statement to the load builder
     *
     * ```ts
     * const user = await User.firstOrFail()
     * await user
     *   .load('settings')
     *   .load('posts', 'comments', 'replies', ['image', 'localizedText'])
     *   .execute()
     * ```
     */
    load<I extends LoadBuilder<DreamInstance>, DB extends DreamInstance['DB'], TableName extends DreamInstance['table'], Schema extends DreamInstance['schema'], const Arr extends readonly unknown[]>(this: I, ...args: [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]): I;
    /**
     * executes a load builder query, binding
     * all associations to their respective model
     * instances.
     *
     * ```ts
     * const user = await User.firstOrFail()
     * await user
     *   .load('settings')
     *   .load('posts', 'comments', 'replies', ['image', 'localizedText'])
     *   .execute()
     * ```
     */
    execute(): Promise<DreamInstance>;
}
