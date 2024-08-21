import { WhereStatementForAssociation } from '../decorators/associations/shared';
import Dream from '../dream';
import { DestroyOptions } from './internal/destroyOptions';
import LoadBuilder from './load-builder';
import Query from './query';
import DreamTransaction from './transaction';
import { AllDefaultScopeNames, DreamAssociationNamesWithoutRequiredWhereClauses, DreamAssociationNamesWithRequiredWhereClauses, DreamAssociationType, DreamAttributes, FinalVariadicTableName, TableColumnType, UpdateableAssociationProperties, UpdateableProperties, VariadicCountThroughArgs, VariadicLoadArgs, VariadicMinMaxThroughArgs, VariadicPluckEachThroughArgs, VariadicPluckThroughArgs } from './types';
export default class DreamInstanceTransactionBuilder<DreamInstance extends Dream> {
    dreamInstance: DreamInstance;
    dreamTransaction: DreamTransaction<Dream>;
    constructor(dreamInstance: DreamInstance, txn: DreamTransaction<Dream>);
    /**
     * Plucks the specified fields from the join Query,
     * scoping the query to the model instance's primary
     * key.
     *
     * ```ts
     *
     * await ApplicationModel.transaction(async txn => {
     *   const user = await User.txn(txn).first()
     *   await user.txn(txn).pluckThrough(
     *     'posts',
     *     { createdAt: range(CalendarDate.yesterday()) },
     *     'comments',
     *     'replies',
     *     'replies.body'
     *   )
     * })
     * // ['loved it!', 'hated it :(']
     * ```
     *
     * If more than one column is requested, a multi-dimensional
     * array is returned:
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   const user = await User.txn(txn).first()
     *   await user.txn(txn).pluckThrough(
     *     'posts',
     *     { createdAt: range(CalendarDate.yesterday()) },
     *     'comments',
     *     'replies',
     *     ['replies.body', 'replies.numLikes']
     *   )
     * })
     * // [['loved it!', 1], ['hated it :(', 3]]
     * ```
     *
     * @param args - A chain of association names and where clauses ending with the column or array of columns to pluck
     * @returns An array of pluck results
     */
    pluckThrough<I extends DreamInstanceTransactionBuilder<DreamInstance>, DB extends DreamInstance['DB'], TableName extends DreamInstance['table'], Schema extends DreamInstance['schema'], const Arr extends readonly unknown[]>(this: I, ...args: [...Arr, VariadicPluckThroughArgs<DB, Schema, TableName, Arr>]): Promise<any[]>;
    /**
     * Plucks the specified fields from the join Query in batches,
     * passing each plucked value/set of plucked values
     * into the provided callback function. It will continue
     * doing this until it exhausts all results in the
     * Query. This is useful when plucking would result in
     * more results than would be desirable to instantiate
     * in memory/more results than would be desirable to handle
     * between awaits.
     *
     * ```ts
     * const user = await User.first()
     *
     * await ApplicationModel.transaction(async txn => {
     *   await user.txn(txn).pluckEachThrough(
     *     'posts',
     *     { createdAt: range(CalendarDate.yesterday()) },
     *     'comments',
     *     'replies',
     *     ['replies.body', 'replies.numLikes'],
     *     ([body, numLikes]) => {
     *       console.log({ body, numLikes })
     *     }
     *   )
     *
     *   // { body: 'loved it!', numLikes: 2 }
     *   // { body: 'hated it :(', numLikes: 0 }
     *   })
     * ```
     *
     * @param args - A chain of association names and where clauses ending with the column or array of columns to pluck and the callback function
     * @returns void
     */
    pluckEachThrough<I extends DreamInstanceTransactionBuilder<DreamInstance>, DB extends DreamInstance['DB'], Schema extends DreamInstance['schema'], TableName extends DreamInstance['table'], const Arr extends readonly unknown[]>(this: I, ...args: [...Arr, VariadicPluckEachThroughArgs<DB, Schema, TableName, Arr>]): Promise<void>;
    /**
     * Join through associations, with optional where clauses,
     * and return the minimum value for the specified column
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   const firstPostId = await user.txn(txn).minThrough('posts', { createdAt: range(start) }, 'posts.rating')
     * })
     * // 2.5
     * ```
     *
     * @param args - A chain of association names and where clauses ending with the column to min
     * @returns the min value of the specified column for the nested association's records
     */
    minThrough<I extends DreamInstanceTransactionBuilder<DreamInstance>, DB extends DreamInstance['DB'], Schema extends DreamInstance['schema'], TableName extends DreamInstance['table'], const Arr extends readonly unknown[], FinalColumnWithAlias extends VariadicMinMaxThroughArgs<DB, Schema, TableName, Arr>, FinalColumn extends FinalColumnWithAlias extends Readonly<`${string}.${infer R extends Readonly<string>}`> ? R : never, FinalTableName extends FinalVariadicTableName<DB, Schema, TableName, Arr>, FinalColumnType extends TableColumnType<Schema, FinalTableName, FinalColumn>>(this: I, ...args: [...Arr, FinalColumnWithAlias]): Promise<FinalColumnType>;
    /**
     * Join through associations, with optional where clauses,
     * and return the maximum value for the specified column
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   const firstPostId = await user.txn(txn).maxThrough('posts', { createdAt: range(start) }, 'posts.rating')
     * })
     * // 4.8
     * ```
     *
     * @param args - A chain of association names and where clauses ending with the column to max
     * @returns the max value of the specified column for the nested association's records
     */
    maxThrough<I extends DreamInstanceTransactionBuilder<DreamInstance>, DB extends DreamInstance['DB'], Schema extends DreamInstance['schema'], TableName extends DreamInstance['table'], const Arr extends readonly unknown[], FinalColumnWithAlias extends VariadicMinMaxThroughArgs<DB, Schema, TableName, Arr>, FinalColumn extends FinalColumnWithAlias extends Readonly<`${string}.${infer R extends Readonly<string>}`> ? R : never, FinalTableName extends FinalVariadicTableName<DB, Schema, TableName, Arr>, FinalColumnType extends TableColumnType<Schema, FinalTableName, FinalColumn>>(this: I, ...args: [...Arr, FinalColumnWithAlias]): Promise<FinalColumnType>;
    /**
     * Retrieves the number of records matching
     * the given query.
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await user.txn(txn).where({ email: null }).countThrough('posts', 'comments', { body: null })
     *   // 42
     * })
     * ```
     *
     * @param args - A chain of association names and where clauses
     * @returns the number of records found matching the given parameters
     */
    countThrough<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema'], TableName extends DreamInstance['table'], const Arr extends readonly unknown[]>(...args: [...Arr, VariadicCountThroughArgs<DB, Schema, TableName, Arr>]): Promise<number>;
    /**
     * Loads the requested associations upon execution
     *
     * NOTE: Preload is often a preferrable way of achieving the
     * same goal.
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await user
     *    .txn(txn)
     *    .load('posts', { body: ops.ilike('%hello world%') }, 'comments', 'replies')
     *    .load('images')
     *    .execute()
     *
     *   user.posts[0].comments[0].replies[0]
     *   // Reply{}
     *
     *   user.images[0]
     *   // Image{}
     * })
     * ```
     *
     * @param args - A list of associations (and optional where clauses) to load
     * @returns A chainable LoadBuilder instance
     */
    load<I extends DreamInstanceTransactionBuilder<DreamInstance>, DB extends DreamInstance['DB'], TableName extends DreamInstance['table'], Schema extends DreamInstance['schema'], const Arr extends readonly unknown[]>(this: I, ...args: [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]): LoadBuilder<DreamInstance>;
    /**
     * Deletes the record represented by this instance
     * from the database, calling any destroy
     * hooks on this model.
     *
     * ```ts
     * const user = await User.last()
     * await ApplicationModel.transaction(async txn => {
     *   await user.txn(txn).destroy()
     * })
     * ```
     *
     * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
     * @param opts.cascade - if false, will skip applying cascade deletes on "dependent: 'destroy'" associations. Defaults to true
     * @returns the instance that was destroyed
     */
    destroy<I extends DreamInstanceTransactionBuilder<DreamInstance>>(this: I, options?: DestroyOptions<DreamInstance>): Promise<DreamInstance>;
    /**
     * Deletes the record represented by this instance
     * from the database, calling any destroy
     * hooks on this model.
     *
     * ```ts
     * const user = await User.last()
     * await ApplicationModel.transaction(async txn => {
     *   await user.txn(txn).reallyDestroy()
     * })
     * ```
     *
     * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
     * @param opts.cascade - if false, will skip applying cascade deletes on "dependent: 'destroy'" associations. Defaults to true
     * @returns the instance that was destroyed
     */
    reallyDestroy<I extends DreamInstanceTransactionBuilder<DreamInstance>>(this: I, options?: DestroyOptions<DreamInstance>): Promise<DreamInstance>;
    /**
     * Undestroys a SoftDelete model, unsetting
     * the `deletedAt` field in the database.
     *
     * If the model is not a SoftDelete model,
     * this will raise an exception.
     *
     * ```ts
     * const user = await User.removeAllDefaultScopes().last()
     * await user.undestroy()
     * // 12
     * ```
     *
     * @returns The number of records that were removed
     */
    undestroy<I extends DreamInstanceTransactionBuilder<DreamInstance>>(this: I, options?: DestroyOptions<DreamInstance>): Promise<I>;
    /**
     * Applies all attribute changes passed to the Dream
     * instance, leveraging any custom-defined setters,
     * and then saves the Dream instance. Can be called
     * on an unpersisted Dream instance.
     *
     * See {@link Dream.save | save} for details on
     * the side effects of saving.
     *
     * NOTE:
     * To bypass custom-defined setters, use {@link Dream.updateAttributes | updateAttributes} instead.
     *
     * ```ts
     *  const user = await User.create({ email: 'saly@gmail.com' })
     *  await ApplicationModel.transaction(async txn => {
     *    await user.txn(txn).update({ email: 'sally@gmail.com' })
     *  })
     * ```
     *
     * @param attributes - the attributes to set on the model
     * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
     * @returns void
     */
    update<I extends DreamInstanceTransactionBuilder<DreamInstance>>(this: I, attributes: UpdateableProperties<DreamInstance>, { skipHooks }?: {
        skipHooks?: boolean;
    }): Promise<void>;
    /**
     * Applies all attribute changes passed to the dream,
     * bypassing any custom-defined setters,
     * and then saves the dream instance. Does not bypass
     * model hooks.
     *
     * See {@link Dream.save | save} for details on
     * the side effects of saving.
     *
     * NOTE:
     * To update the values without bypassing any custom-defined
     * setters, use {@link Dream.update | update} instead.
     *
     * ```ts
     * const user = await User.create({ email: 'saly@gmail.com' })
     *  await ApplicationModel.transaction(async txn => {
     *    await user.txn(txn).updateAttributes({ email: 'sally@gmail.com' })
     *  })
     * ```
     *
     * @param attributes - The attributes to update on this instance
     * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
     * @returns - void
     */
    updateAttributes<I extends DreamInstanceTransactionBuilder<DreamInstance>>(this: I, attributes: UpdateableProperties<DreamInstance>, { skipHooks }?: {
        skipHooks?: boolean;
    }): Promise<void>;
    /**
     * Reloads an instance, refreshing all it's attribute values
     * to those in the database.
     *
     * NOTE: this does not refresh associations
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await user.txn(txn).reload()
     * })
     * ```
     *
     * @returns void
     */
    reload<I extends DreamInstanceTransactionBuilder<DreamInstance>>(this: I): Promise<void>;
    /**
     * Saves the state of the current instance to the
     * database. For new instances (that have not been
     * persisted), `save` and `create` model hooks will be called.
     * For instances that have already been persisted,
     * the `save` and `update` model hooks will be called.
     *
     * Upon saving a new instance, the primary key, timestamp
     * fields (if defined), and `type` (if STI) will be set on
     * the model.
     *
     * Upon updating an instance, the update timestamp (if defined)
     * will be updated on the model.
     *
     * ```ts
     * const user = User.new({ email: 'how@yadoin' })
     *
     * await ApplicationModel.transaction(async txn => {
     *   user.name = 'fred'
     *   await user.txn(txn).save()
     * })
     *
     * user.email // 'how@yadoin'
     * user.name // 'fred'
     * user.id // 1
     * user.createdAt // A DateTime object
     * user.updatedAt // A DateTime object
     *
     * // If User were STI:
     * user.type // 'User'
     * ```
     *
     * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
     * @returns void
     */
    save<I extends DreamInstanceTransactionBuilder<DreamInstance>>(this: I, { skipHooks }?: {
        skipHooks?: boolean;
    }): Promise<void>;
    /**
     * Returns a Query instance for the specified
     * association on the current instance.
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await user.txn(txn).associationQuery('posts').all()
     *   // only user posts returned
     * })
     * ```
     *
     * @returns A Query scoped to the specified association on the current instance
     */
    associationQuery<I extends DreamInstanceTransactionBuilder<DreamInstance>, AssociationName extends keyof DreamInstance['schema'][DreamInstance['table']]['associations']>(this: I, associationName: AssociationName): Query<DreamAssociationType<DreamInstance, AssociationName>>;
    updateAssociation<I extends DreamInstanceTransactionBuilder<DreamInstance>, DB extends DreamInstance['DB'], TableName extends DreamInstance['table'], Schema extends DreamInstance['schema'], AssociationName extends keyof DreamInstance & DreamAssociationNamesWithRequiredWhereClauses<DreamInstance>>(this: I, associationName: AssociationName, attributes: Partial<DreamAttributes<DreamAssociationType<DreamInstance, AssociationName>>>, updateAssociationOptions: {
        bypassAllDefaultScopes?: boolean;
        defaultScopesToBypass?: AllDefaultScopeNames<DreamInstance>[];
        cascade?: boolean;
        skipHooks?: boolean;
        where: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>;
    }): Promise<number>;
    updateAssociation<I extends DreamInstanceTransactionBuilder<DreamInstance>, DB extends DreamInstance['DB'], TableName extends DreamInstance['table'], Schema extends DreamInstance['schema'], AssociationName extends keyof DreamInstance & DreamAssociationNamesWithoutRequiredWhereClauses<DreamInstance>>(this: I, associationName: AssociationName, attributes: Partial<DreamAttributes<DreamAssociationType<DreamInstance, AssociationName>>>, updateAssociationOptions?: {
        bypassAllDefaultScopes?: boolean;
        defaultScopesToBypass?: AllDefaultScopeNames<DreamInstance>[];
        cascade?: boolean;
        skipHooks?: boolean;
        where?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>;
    }): Promise<number>;
    /**
     * Creates an association for an instance. Automatically
     * handles setting foreign key and, in the case of polymorphism,
     * foreign key type.
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await user.txn(txn).createAssociation('posts', { body: 'hello world' })
     * })
     * ```
     *
     * @param associationName - the name of the association to create
     * @param attributes - the attributes with which to create the associated model
     * @returns The created association
     */
    createAssociation<I extends DreamInstanceTransactionBuilder<DreamInstance>, AssociationName extends keyof DreamInstance['schema'][DreamInstance['table']]['associations'], PossibleArrayAssociationType = DreamInstance[AssociationName & keyof DreamInstance], AssociationType = PossibleArrayAssociationType extends (infer ElementType)[] ? ElementType : PossibleArrayAssociationType, RestrictedAssociationType extends AssociationType extends Dream ? AssociationType : never = AssociationType extends Dream ? AssociationType : never>(this: I, associationName: AssociationName, opts?: UpdateableAssociationProperties<DreamInstance, RestrictedAssociationType>): Promise<NonNullable<AssociationType>>;
    destroyAssociation<I extends DreamInstanceTransactionBuilder<DreamInstance>, AssociationName extends keyof DreamInstance & DreamAssociationNamesWithRequiredWhereClauses<DreamInstance>, DB extends DreamInstance['DB'], TableName extends DreamInstance['table'], Schema extends DreamInstance['schema']>(this: I, associationName: AssociationName, options: DestroyOptions<DreamInstance> & {
        where: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>;
    }): Promise<number>;
    destroyAssociation<I extends DreamInstanceTransactionBuilder<DreamInstance>, AssociationName extends keyof DreamInstance & DreamAssociationNamesWithoutRequiredWhereClauses<DreamInstance>, DB extends DreamInstance['DB'], TableName extends DreamInstance['table'], Schema extends DreamInstance['schema']>(this: I, associationName: AssociationName, options?: DestroyOptions<DreamInstance> & {
        where?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>;
    }): Promise<number>;
    reallyDestroyAssociation<I extends DreamInstanceTransactionBuilder<DreamInstance>, AssociationName extends keyof DreamInstance & DreamAssociationNamesWithRequiredWhereClauses<DreamInstance>, DB extends DreamInstance['DB'], TableName extends DreamInstance['table'], Schema extends DreamInstance['schema']>(this: I, associationName: AssociationName, options: DestroyOptions<DreamInstance> & {
        where: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>;
    }): Promise<number>;
    reallyDestroyAssociation<I extends DreamInstanceTransactionBuilder<DreamInstance>, AssociationName extends keyof DreamInstance & DreamAssociationNamesWithoutRequiredWhereClauses<DreamInstance>, DB extends DreamInstance['DB'], TableName extends DreamInstance['table'], Schema extends DreamInstance['schema']>(this: I, associationName: AssociationName, options?: DestroyOptions<DreamInstance> & {
        where?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>;
    }): Promise<number>;
    undestroyAssociation<I extends DreamInstanceTransactionBuilder<DreamInstance>, DB extends DreamInstance['DB'], TableName extends DreamInstance['table'], Schema extends DreamInstance['schema'], AssociationName extends keyof I & DreamAssociationNamesWithRequiredWhereClauses<DreamInstance>>(this: I, associationName: AssociationName, options: DestroyOptions<DreamInstance> & {
        where: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>;
    }): Promise<number>;
    undestroyAssociation<I extends DreamInstanceTransactionBuilder<DreamInstance>, DB extends DreamInstance['DB'], TableName extends DreamInstance['table'], Schema extends DreamInstance['schema'], AssociationName extends keyof I & DreamAssociationNamesWithoutRequiredWhereClauses<DreamInstance>>(this: I, associationName: AssociationName, options?: DestroyOptions<DreamInstance> & {
        where?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>;
    }): Promise<number>;
    /**
     * @internal
     *
     * returns a query instance, scoped to the current
     * dream instance with primary key where statement
     * automatically applied.
     */
    private queryInstance;
}
