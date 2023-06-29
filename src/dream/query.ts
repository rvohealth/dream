import { ExtractTableAlias } from 'kysely/dist/cjs/parser/table-parser'
import { AssociationTableNames } from '../db/reflections'
import { WhereStatement } from '../decorators/associations/shared'
import {
  AssociationExpression,
  JoinsPluckAssociationExpression,
  JoinsWhereAssociationExpression,
} from './types'
import {
  ComparisonOperator,
  ComparisonOperatorExpression,
  DeleteQueryBuilder,
  SelectArg,
  SelectExpression,
  SelectQueryBuilder,
  SelectType,
  Transaction,
  UpdateQueryBuilder,
  Updateable,
} from 'kysely'
import { DB, InterpretedDB } from '../sync/schema'
import { marshalDBValue } from '../helpers/marshalDBValue'
import Dream from '../dream'
import { HasManyStatement } from '../decorators/associations/has-many'
import { HasOneStatement } from '../decorators/associations/has-one'
import { BelongsToStatement } from '../decorators/associations/belongs-to'
import _db from '../db'
import CannotJoinPolymorphicBelongsToError from '../exceptions/cannot-join-polymorphic-belongs-to-error'
import OpsStatement from '../ops/ops-statement'
import { Range } from '../helpers/range'
import { DateTime } from 'luxon'
import { SyncedAssociations } from '../sync/associations'
import DreamTransaction from './transaction'
import sqlResultToDreamInstance from './internal/sqlResultToDreamInstance'
import ForeignKeyOnAssociationDoesNotMatchPrimaryKeyOnBase from '../exceptions/foreign-key-on-association-does-not-match-primary-key-on-base'
import CurriedOpsStatement from '../ops/curried-ops-statement'
import CannotAssociateThroughPolymorphic from '../exceptions/cannot-associate-through-polymorphic'
import MissingThroughAssociation from '../exceptions/missing-through-association'
import compact from '../helpers/compact'

const OPERATION_NEGATION_MAP: Partial<{ [Property in ComparisonOperator]: ComparisonOperator }> = {
  '=': '!=',
  '==': '!=',
  '!=': '==',
  '<>': '==',
  '>': '<=',
  '>=': '<',
  '<': '>=',
  '<=': '>',
  in: 'not in',
  'not in': 'in',
  is: 'is not',
  'is not': 'is',
  like: 'not like',
  'not like': 'like',
  // 'match',
  ilike: 'not ilike',
  'not ilike': 'ilike',
  // '@>',
  // '<@',
  // '?',
  // '?&',
  '!<': '<',
  '!>': '>',
  // '<=>',
  '!~': '~',
  '~': '!~',
  '~*': '!~*',
  '!~*': '~*',
  // '@@',
  // '@@@',
  // '!!',
  // '<->',
}

export default class Query<
  DreamClass extends typeof Dream,
  Table = DB[InstanceType<DreamClass>['table']],
  QueryAssociationExpression = AssociationExpression<InstanceType<DreamClass>['table'], any>,
  ColumnType = keyof DB[keyof DB] extends never ? unknown : keyof DB[keyof DB]
> {
  public whereStatement: WhereStatement<any>[] = []
  public whereNotStatement: WhereStatement<any>[] = []
  public whereJoinsStatement: JoinsWhereAssociationExpression<
    InstanceType<DreamClass>['table'],
    AssociationExpression<InstanceType<DreamClass>['table'], any>
  >[] = []
  public limitStatement: { count: number } | null = null
  public orStatements: Query<DreamClass>[] = []
  public orderStatement: { column: ColumnType & string; direction: 'asc' | 'desc' } | null = null
  public includesStatements: AssociationExpression<InstanceType<DreamClass>['table'], any>[] = []
  public joinsStatements: AssociationExpression<InstanceType<DreamClass>['table'], any>[] = []
  public shouldBypassDefaultScopes: boolean = false
  public dreamClass: DreamClass
  public dreamTransaction: DreamTransaction | null = null

  public get db() {
    return this.dreamTransaction?.kyselyTransaction || _db
  }

  constructor(DreamClass: DreamClass) {
    this.dreamClass = DreamClass
  }

  public async find<
    T extends Query<DreamClass>,
    TableName extends keyof InterpretedDB = InstanceType<DreamClass>['table'] & keyof InterpretedDB
  >(
    this: T,
    id: InterpretedDB[TableName][DreamClass['primaryKey'] & keyof InterpretedDB[TableName]]
  ): Promise<(InstanceType<DreamClass> & Dream) | null> {
    // @ts-ignore
    return await this.where({
      [this.dreamClass.primaryKey]: id,
    }).first()
  }

  public async findBy<T extends Query<DreamClass>>(
    this: T,
    attributes: Updateable<DB[InstanceType<DreamClass>['table']]>
  ): Promise<(InstanceType<DreamClass> & Dream) | null> {
    return await this.where(attributes).first()
  }

  public includes<
    T extends Query<DreamClass>,
    QueryAssociationExpression extends AssociationExpression<
      InstanceType<DreamClass>['table'],
      any
    > = AssociationExpression<InstanceType<DreamClass>['table'], any>
  >(this: T, ...args: QueryAssociationExpression[]) {
    this.includesStatements = [...(this.includesStatements as any), ...args]
    return this
  }

  public or(orStatement: Query<DreamClass>) {
    this.orStatements = [...this.orStatements, orStatement]
    return this
  }

  public joins<
    T extends Query<DreamClass>,
    QueryAssociationExpression extends AssociationExpression<
      InstanceType<DreamClass>['table'],
      any
    > = AssociationExpression<InstanceType<DreamClass>['table'], any>
  >(this: T, ...args: QueryAssociationExpression[]) {
    ;(this as any).joinsStatements = [...this.joinsStatements, ...args]
    return this
  }

  public unscoped<T extends Query<DreamClass>>(this: T): T {
    this.shouldBypassDefaultScopes = true
    return this
  }

  public where<T extends Query<DreamClass>>(
    this: T,
    attributes:
      | WhereStatement<InstanceType<DreamClass>['table']>
      | JoinsWhereAssociationExpression<InstanceType<DreamClass>['table'], T['joinsStatements'][number]>
  ): T {
    return this._where(attributes, this.whereStatement)
  }

  public whereNot<T extends Query<DreamClass>>(
    this: T,
    attributes: WhereStatement<InstanceType<DreamClass>['table']>
  ): T {
    return this._where(attributes, this.whereNotStatement)
  }

  private _where<T extends Query<DreamClass>>(
    this: T,
    attributes:
      | WhereStatement<InstanceType<DreamClass>['table']>
      | JoinsWhereAssociationExpression<InstanceType<DreamClass>['table'], T['joinsStatements'][number]>,
    whereStatement: WhereStatement<any>
  ): T {
    if (attributes.constructor === Array) {
      // @ts-ignore
      this.whereJoinsStatement = [...(this.whereJoinsStatement as any), ...attributes]
    } else {
      const chainableWhereStatement: WhereStatement<any> = {}
      whereStatement.push(chainableWhereStatement)

      Object.keys(attributes).forEach(key => {
        if ((this.dreamClass.columns() as any[]).includes(key)) {
          // @ts-ignore
          chainableWhereStatement[key] = attributes[key]
        } else {
          // @ts-ignore
          this.whereJoinsStatement.push({ [key]: attributes[key] })
        }
      })
    }

    return this
  }

  public nestedSelect<
    T extends Query<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    SimpleFieldType extends keyof Updateable<DB[TableName]>,
    JoinsFieldType extends JoinsPluckAssociationExpression<
      InstanceType<DreamClass>['table'],
      T['joinsStatements'][number]
    >
  >(this: T, selection: SimpleFieldType | JoinsFieldType) {
    const query = this.buildSelect({ bypassSelectAll: true }) as SelectQueryBuilder<
      DB,
      ExtractTableAlias<DB, InstanceType<DreamClass>['table']>,
      {}
    >
    return query.select(selection as any)
  }

  public order<ColumnName extends keyof Table & string>(
    column: ColumnName,
    direction: 'asc' | 'desc' = 'asc'
  ) {
    this.orderStatement = { column: column as any, direction }
    return this
  }

  public limit(count: number) {
    this.limitStatement = { count }
    return this
  }

  public sql() {
    const query = this.buildSelect()
    return query.compile()
  }

  public toKysely(type: 'select' | 'update' | 'delete' = 'select') {
    switch (type) {
      case 'select':
        return this.buildSelect()

      case 'delete':
        return this.buildDelete()

      case 'update':
        return this.buildUpdate({})
    }
  }

  public txn(dreamTransaction: DreamTransaction) {
    this.dreamTransaction = dreamTransaction
    return this
  }

  public async count<T extends Query<DreamClass>>(this: T) {
    const { count } = this.db.fn
    let query = this.buildSelect({ bypassSelectAll: true })

    query = query.select(
      count(`${this.dreamClass.prototype.table}.${this.dreamClass.primaryKey}` as any).as('tablecount')
    )

    const data = (await query.executeTakeFirstOrThrow()) as any

    return parseInt(data.tablecount.toString())
  }

  public async max<
    T extends Query<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    SimpleFieldType extends keyof Updateable<DB[TableName]>,
    JoinsFieldType extends JoinsPluckAssociationExpression<
      InstanceType<DreamClass>['table'],
      T['joinsStatements'][number]
    >
  >(this: T, field: SimpleFieldType | JoinsFieldType) {
    const { max } = this.db.fn
    let query = this.buildSelect({ bypassSelectAll: true })

    query = query.select(max(field as any) as any)
    const data = (await query.executeTakeFirstOrThrow()) as any

    return data.max
  }

  public async min<
    T extends Query<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    SimpleFieldType extends keyof Updateable<DB[TableName]>,
    JoinsFieldType extends JoinsPluckAssociationExpression<
      InstanceType<DreamClass>['table'],
      T['joinsStatements'][number]
    >
  >(this: T, field: SimpleFieldType | JoinsFieldType) {
    const { min } = this.db.fn
    let query = this.buildSelect({ bypassSelectAll: true })

    query = query.select(min(field as any) as any)
    const data = (await query.executeTakeFirstOrThrow()) as any

    return data.min
  }

  public async pluck<
    T extends Query<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    SimpleFieldType extends keyof Updateable<DB[TableName]>,
    JoinsFieldType extends JoinsPluckAssociationExpression<
      InstanceType<DreamClass>['table'],
      T['joinsStatements'][number]
    >
  >(this: T, ...fields: (SimpleFieldType | JoinsFieldType)[]): Promise<any[]> {
    let query = this.buildSelect({ bypassSelectAll: true })
    fields.forEach(field => {
      query = query.select(field as any)
    })

    const vals = (await query.execute()).map(result => Object.values(result))

    if (fields.length > 1) {
      return vals.map(arr =>
        arr.map((val, index) =>
          marshalDBValue(val, { table: this.dreamClass.prototype.table, column: fields[index] as any })
        )
      ) as any[]
    } else {
      return vals
        .flat()
        .map((val, index) =>
          marshalDBValue(val, { table: this.dreamClass.prototype.table, column: fields[index] as any })
        ) as any[]
    }
  }

  public async all<T extends Query<DreamClass>>(this: T) {
    const query = this.buildSelect()
    let results: any[]

    const sqlString = query.compile().sql
    const paramsString = query.compile().parameters.join(', ')
    const sqlDebugMessage = `
      ${sqlString}
      [ ${paramsString} ]
      NOTE: to turn this message off, remove the DEBUG=1 env variable
    `
    try {
      if (process.env.DEBUG === '1') {
        console.log(
          `
            About to execute the following SQL:
            ${sqlDebugMessage}
          `
        )
      }
      results = await query.execute()
    } catch (error) {
      if (process.env.DEBUG === '1') {
        console.error(`
          Error executing the following SQL:
          ${error}

          ${sqlDebugMessage}
        `)
      }
      // throw the original error to maintain stack trace
      throw error
    }

    const theAll = results.map(r =>
      sqlResultToDreamInstance(this.dreamClass, r)
    ) as InstanceType<DreamClass>[]
    await this.applyThisDotIncludes(theAll)
    return theAll
  }

  public async first<T extends Query<DreamClass>>(this: T) {
    if (!this.orderStatement) this.order(this.dreamClass.primaryKey as any, 'asc')

    const query = this.buildSelect()
    const results = await query.executeTakeFirst()

    if (results) {
      const theFirst = new this.dreamClass(results as any) as InstanceType<DreamClass>
      await this.applyThisDotIncludes([theFirst])
      return theFirst
    } else return null
  }

  public async applyThisDotIncludes<T extends Query<DreamClass>>(this: T, dreams: Dream[]) {
    for (const includesStatement of this.includesStatements) {
      await this.applyIncludes(includesStatement, dreams)
    }
  }

  public hydrateAssociation(
    dreams: Dream[],
    association: HasManyStatement<any> | HasOneStatement<any> | BelongsToStatement<any>,
    loadedAssociations: Dream[]
  ) {
    // dreams is a Rating
    // Rating belongs to: rateables (Posts / Compositions)
    // loadedAssociations is an array of Posts and Compositions
    // if rating.rateable_id === loadedAssociation.primaryKeyvalue
    //  rating.rateable = loadedAssociation
    for (const loadedAssociation of loadedAssociations) {
      if (association.type === 'BelongsTo') {
        dreams
          .filter((dream: any) => {
            if (association.polymorphic) {
              return (
                dream[association.foreignKeyTypeField()] === loadedAssociation.constructor.name &&
                dream[association.foreignKey()] === loadedAssociation.primaryKeyValue
              )
            } else {
              return dream[association.foreignKey()] === loadedAssociation.primaryKeyValue
            }
          })
          .forEach((dream: any) => {
            dream[association.as] = loadedAssociation
          })
      } else {
        dreams.forEach(dream => {
          if (
            (loadedAssociation as any)[association.foreignKey()].constructor !==
            dream.primaryKeyValue!.constructor
          )
            throw new ForeignKeyOnAssociationDoesNotMatchPrimaryKeyOnBase({
              baseDreamClass: dream.constructor as typeof Dream,
              associationDreamClass: loadedAssociation.constructor as typeof Dream,
              foreignKeyColumnName: association.foreignKey() as string,
            })
        })

        dreams
          .filter(dream => (loadedAssociation as any)[association.foreignKey()] === dream.primaryKeyValue)
          .forEach((dream: any) => {
            if (association.type === 'HasMany') {
              dream[association.as] ||= []
              dream[association.as].push(loadedAssociation)
            } else {
              dream[association.as] = loadedAssociation
            }
          })
      }
    }

    if (association.type === 'HasMany') {
      dreams.forEach((dream: any) => {
        if (dream[association.as]) Object.freeze(dream[association.as])
      })
    }
  }

  public async includesBridgeThroughAssociations(
    dreamClass: typeof Dream,
    dreams: Dream[],
    association: HasOneStatement<any> | HasManyStatement<any> | BelongsToStatement<any>
  ): Promise<{
    dreams: Dream[]
    association: HasOneStatement<any> | HasManyStatement<any> | BelongsToStatement<any>
  }> {
    if (association.type === 'BelongsTo' || !association.through) {
      return { dreams: compact(dreams), association }
    } else {
      // Post has many Commenters through Comments
      // hydrate Post Comments
      await this.applyOneInclude(association.through, dreams)

      dreams.forEach(dream => {
        if (association.type === 'HasMany') {
          Object.defineProperty(dream, association.as, {
            get() {
              return Object.freeze(
                ((dream as any)[association.through!] as any[]).flatMap(
                  record => (record as any)![association.source]
                )
              )
            },
          })
        } else {
          Object.defineProperty(dream, association.as, {
            get() {
              return (dream as any)[association.through!]![association.source]
            },
          })
        }
      })

      // return:
      //  Comments,
      //  the Comments -> CommentAuthors hasMany association
      // So that Comments may be properly hydrated with many CommentAuthors
      const newDreams = (dreams as any[]).flatMap(dream => dream[association.through!])

      const throughClass = dreamClass.associationMap[association.through].modelCB() as typeof Dream
      if (throughClass.constructor === Array)
        throw new CannotAssociateThroughPolymorphic({
          dreamClass,
          association,
        })

      const newAssociation = throughClass.associationMap[association.source]

      if (!newAssociation)
        throw new MissingThroughAssociation({
          dreamClass,
          throughClass,
          association,
        })

      return await this.includesBridgeThroughAssociations(dreamClass, newDreams, newAssociation)
    }
  }

  public async applyOneInclude(currentAssociationTableOrAlias: string, dreams: Dream | Dream[]) {
    if (dreams.constructor !== Array) dreams = [dreams as Dream]

    const dream = dreams[0]
    if (!dream) return

    let association = dream.associationMap[currentAssociationTableOrAlias]
    let associationQuery

    const results = await this.includesBridgeThroughAssociations(
      dream.constructor as typeof Dream,
      dreams,
      association
    )
    dreams = results.dreams
    association = results.association

    if (association.type === 'BelongsTo') {
      if (association.polymorphic) {
        // Rating polymorphically BelongsTo Composition and Post
        // for each of Composition and Post
        for (const associatedModel of association.modelCB() as (typeof Dream)[]) {
          const relevantAssociatedModels = dreams.filter((dream: any) => {
            return (dream as any)[association.foreignKeyTypeField()] === associatedModel.name
          })

          if (relevantAssociatedModels.length) {
            associationQuery = this.dreamTransaction
              ? associatedModel.txn(this.dreamTransaction)
              : associatedModel

            // @ts-ignore
            associationQuery = associationQuery.where({
              [associatedModel.primaryKey]: relevantAssociatedModels.map(
                (dream: any) => (dream as any)[association.foreignKey()]
              ),
            })

            this.hydrateAssociation(dreams, association, await associationQuery.all())
          }
        }
      } else {
        const associatedModel = association.modelCB() as typeof Dream
        associationQuery = this.dreamTransaction
          ? associatedModel.txn(this.dreamTransaction)
          : associatedModel

        // @ts-ignore
        associationQuery = associationQuery.where({
          [associatedModel.primaryKey]: dreams.map(dream => (dream as any)[association.foreignKey()]),
        })

        this.hydrateAssociation(dreams, association, await associationQuery.all())
      }
    } else {
      const associatedModel = association.modelCB() as typeof Dream
      associationQuery = this.dreamTransaction ? associatedModel.txn(this.dreamTransaction) : associatedModel
      // @ts-ignore
      associationQuery = associationQuery.where({
        [association.foreignKey()]: dreams.map(dream => dream.primaryKeyValue),
      })

      if (association.polymorphic) {
        associationQuery = associationQuery.where({
          [association.foreignKeyTypeField()]: associatedModel.name,
        })
      }

      if (process.env.DEBUG === '1' && association.where) {
        console.log(`
applying where clause for association:
${JSON.stringify(association, null, 2)}
        `)
      }
      if (association.where) associationQuery = associationQuery.where(association.where)

      this.hydrateAssociation(dreams, association, await associationQuery.all())
    }

    return dreams.flatMap(dream => (dream as any)[association.as])
  }

  public async applyIncludes(includesStatement: QueryAssociationExpression, dream: Dream | Dream[]) {
    switch ((includesStatement as any).constructor) {
      case String:
        await this.applyOneInclude(includesStatement as string, dream)
        break
      case Array:
        for (const str of includesStatement as QueryAssociationExpression[]) {
          await this.applyIncludes(str, dream)
        }
        break
      default:
        for (const key of Object.keys(includesStatement as any)) {
          const nestedDream = await this.applyOneInclude(key, dream)
          if (nestedDream) {
            await this.applyIncludes((includesStatement as any)[key], nestedDream)
          }
        }
    }
  }

  public async last<T extends Query<DreamClass>>(this: T) {
    if (!this.orderStatement) this.order((this.dreamClass as typeof Dream).primaryKey as any, 'desc')

    const query = this.buildSelect()
    const results = await query.executeTakeFirst()

    if (results) {
      const theLast = new this.dreamClass(results) as InstanceType<DreamClass>
      await this.applyThisDotIncludes([theLast])
      return theLast
    } else return null
  }

  public async destroy<T extends Query<DreamClass>>(this: T): Promise<number> {
    const query = this.buildDelete()
    const selectQuery = this.buildSelect()
    const results = await selectQuery.execute()
    await query.execute()
    return results.length
  }

  public async destroyBy<T extends Query<DreamClass>>(
    this: T,
    attributes: Updateable<InstanceType<DreamClass>['table']>
  ) {
    this.where(attributes as any)
    const query = this.buildDelete()
    const selectQuery = this.buildSelect()
    const results = await selectQuery.execute()
    await query.execute()
    return results.length
  }

  public async updateWithoutModelMaintenance<T extends Query<DreamClass>>(
    this: T,
    attributes: Updateable<InstanceType<DreamClass>['table']>
  ) {
    const query = this.buildUpdate(attributes)
    await query.execute()

    const selectQuery = this.buildSelect()
    const results = await selectQuery.execute()

    return results.map(r => new this.dreamClass(r as any) as InstanceType<DreamClass>)
  }

  private conditionallyApplyScopes() {
    if (this.shouldBypassDefaultScopes) return

    const thisScopes = this.dreamClass.scopes.default
    for (const scope of thisScopes) {
      ;(this.dreamClass as any)[scope.method](this)
    }
  }

  private joinsBridgeThroughAssociations<T extends Query<DreamClass>>(
    this: T,
    {
      query,
      dreamClass,
      association,
      previousAssociationTableOrAlias,
    }: {
      query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>
      dreamClass: typeof Dream
      association: HasOneStatement<any> | HasManyStatement<any> | BelongsToStatement<any>
      previousAssociationTableOrAlias: string
    }
  ): {
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>
    dreamClass: typeof Dream
    association: HasOneStatement<any> | HasManyStatement<any> | BelongsToStatement<any>
    previousAssociationTableOrAlias: string
  } {
    if (association.type === 'BelongsTo' || !association.through) {
      return {
        query,
        dreamClass,
        association,
        previousAssociationTableOrAlias,
      }
    } else {
      // Post has many Commenters through Comments
      //  Comments,
      //  the Comments -> CommentAuthors hasMany association
      // dreamClass is Post
      // newDreamClass is Comment
      const results = this.applyOneJoin({
        query,
        dreamClass,
        previousAssociationTableOrAlias,
        currentAssociationTableOrAlias: association.through,
      })

      const throughClass = dreamClass.associationMap[association.through].modelCB() as typeof Dream

      if (throughClass.constructor === Array)
        throw new CannotAssociateThroughPolymorphic({
          dreamClass,
          association,
        })

      const newAssociation = throughClass.associationMap[association.source]

      if (!newAssociation)
        throw new MissingThroughAssociation({
          dreamClass,
          throughClass,
          association,
        })

      return this.joinsBridgeThroughAssociations({
        query: results.query,
        dreamClass: association.modelCB(),
        association: newAssociation,
        previousAssociationTableOrAlias: association.through,
      })
    }
  }

  private applyOneJoin<T extends Query<DreamClass>>(
    this: T,
    {
      query,
      dreamClass,
      previousAssociationTableOrAlias,
      currentAssociationTableOrAlias,
    }: {
      query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>
      dreamClass: typeof Dream
      previousAssociationTableOrAlias: string
      currentAssociationTableOrAlias: string
    }
  ): {
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>
    association: any
    previousAssociationTableOrAlias: string
    currentAssociationTableOrAlias: string
  } {
    // Given:
    // dreamClass: Post
    // previousAssociationTableOrAlias: posts
    // currentAssociationTableOrAlias: commenters
    // Post has many Commenters through Comments
    // whereJoinsStatement: { commenters: { id: <some commenter id> } }
    // association = Post.associationMap[commenters]
    // which gives association = {
    //   through: 'comments',
    //   as: 'commenters',
    //   modelCB: () => Commenter,
    // }
    //
    // We want joinsBridgeThroughAssociations to add to the query:
    // INNER JOINS comments ON posts.id = comments.post_id
    // and update dreamClass to be

    let association = dreamClass.associationMap[currentAssociationTableOrAlias]

    const results = this.joinsBridgeThroughAssociations({
      query,
      dreamClass,
      association,
      previousAssociationTableOrAlias,
    })
    query = results.query
    dreamClass = results.dreamClass
    association = results.association
    previousAssociationTableOrAlias = results.previousAssociationTableOrAlias

    if (association.type === 'BelongsTo') {
      if (association.modelCB().constructor === Array)
        throw new CannotJoinPolymorphicBelongsToError({
          dreamClass,
          association,
          joinsStatements: this.joinsStatements,
        })

      const to = (association.modelCB() as typeof Dream).prototype.table
      const joinTableExpression =
        currentAssociationTableOrAlias === to
          ? currentAssociationTableOrAlias
          : `${to} as ${currentAssociationTableOrAlias as string}`

      // @ts-ignore
      query = query.innerJoin(
        // @ts-ignore
        joinTableExpression,
        `${previousAssociationTableOrAlias}.${association.foreignKey() as string}`,
        `${currentAssociationTableOrAlias as string}.${(association.modelCB() as typeof Dream).primaryKey}`
      )
    } else {
      const to = association.modelCB().prototype.table
      const joinTableExpression =
        currentAssociationTableOrAlias === to
          ? currentAssociationTableOrAlias
          : `${to} as ${currentAssociationTableOrAlias as string}`

      // @ts-ignore
      query = query.innerJoin(
        // @ts-ignore
        joinTableExpression,
        `${previousAssociationTableOrAlias}.${association.modelCB().primaryKey}`,
        `${currentAssociationTableOrAlias as string}.${association.foreignKey() as string}`
      )

      if (!this.shouldBypassDefaultScopes) {
        const tempQuery = new Query<DreamClass>(this.dreamClass)

        const associationClass = association.modelCB() as any
        const associationScopes = associationClass.scopes.default
        for (const scope of associationScopes) {
          associationClass[scope.method](tempQuery)
        }

        query = this.applyWhereStatement(
          query,
          this.aliasWhereStatement(tempQuery.whereStatement, currentAssociationTableOrAlias)
        )
      }

      if (association.where) {
        query = this.applyWhereStatement(
          query,
          this.aliasWhereStatement(
            [association.where as WhereStatement<InstanceType<DreamClass>['table']>],
            currentAssociationTableOrAlias
          )
        )
      }
    }

    return {
      query,
      association,
      previousAssociationTableOrAlias,
      currentAssociationTableOrAlias,
    }
  }

  private recursivelyJoin<T extends Query<DreamClass>, PreviousTableName extends AssociationTableNames>(
    this: T,
    {
      query,
      joinsStatement,
      dreamClass,
      previousAssociationTableOrAlias,
    }: {
      query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>
      joinsStatement:
        | JoinsWhereAssociationExpression<PreviousTableName, AssociationExpression<PreviousTableName, any>>
        | Updateable<DB[PreviousTableName]>
      dreamClass: typeof Dream
      previousAssociationTableOrAlias: string
    }
  ): SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}> {
    if (joinsStatement.constructor === Array) {
      joinsStatement.forEach(oneJoinsStatement => {
        query = this.recursivelyJoin({
          query,
          joinsStatement: oneJoinsStatement as AssociationExpression<AssociationTableNames>,
          dreamClass,
          previousAssociationTableOrAlias,
        }) as SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>
      })

      return query
    } else if (joinsStatement.constructor === String) {
      const results = this.applyOneJoin({
        query,
        dreamClass,
        previousAssociationTableOrAlias,
        currentAssociationTableOrAlias: joinsStatement,
      })

      return results.query
    }

    for (const currentAssociationTableOrAlias of Object.keys(joinsStatement) as string[]) {
      const results = this.applyOneJoin({
        query,
        dreamClass,
        previousAssociationTableOrAlias,
        currentAssociationTableOrAlias,
      })

      query = results.query
      const association = results.association

      query = this.recursivelyJoin({
        query,
        // @ts-ignore
        joinsStatement: joinsStatement[currentAssociationTableOrAlias],
        dreamClass: association.modelCB(),
        previousAssociationTableOrAlias: currentAssociationTableOrAlias,
      })
    }

    return query
  }

  private applyWhereStatement<
    T extends Query<DreamClass>,
    WS extends
      | WhereStatement<InstanceType<DreamClass>['table']>
      | JoinsWhereAssociationExpression<InstanceType<DreamClass>['table'], T['joinsStatements'][number]>
  >(
    this: T,
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>,
    whereStatements: WS | WS[],
    {
      negate = false,
    }: {
      negate?: boolean
    } = {}
  ) {
    ;([whereStatements].flat() as WS[]).forEach(statement => {
      query = this.applySingleWhereStatement(query, statement, { negate })
    })

    return query
  }

  private applySingleWhereStatement<T extends Query<DreamClass>>(
    this: T,
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>,
    whereStatement:
      | WhereStatement<InstanceType<DreamClass>['table']>
      | JoinsWhereAssociationExpression<InstanceType<DreamClass>['table'], T['joinsStatements'][number]>,
    {
      negate = false,
    }: {
      negate?: boolean
    } = {}
  ) {
    Object.keys(whereStatement)
      .filter(key => (whereStatement as any)[key] !== undefined)
      .forEach(attr => {
        let val = (whereStatement as any)[attr]
        let a: any
        let b: ComparisonOperatorExpression
        let c: any
        let a2: any | null = null
        let b2: ComparisonOperatorExpression | null = null
        let c2: any | null = null

        if (val instanceof Function) {
          val = val()
        }

        if (val === null) {
          a = attr
          b = 'is'
          c = val
        } else if (val.constructor === SelectQueryBuilder) {
          a = attr
          b = 'in'
          c = val
        } else if (val.constructor === Array) {
          a = attr
          b = 'in'
          c = val
        } else if (val.constructor === CurriedOpsStatement) {
          val = val.toOpsStatement(this.dreamClass, attr)
          a = attr
          b = val.operator
          c = val.value
        } else if (val.constructor === OpsStatement) {
          a = attr
          b = val.operator
          c = val.value
        } else if (val.constructor === Range) {
          let rangeStart = null
          let rangeEnd = null

          if ((val.begin?.constructor || val.end?.constructor) === DateTime) {
            rangeStart = val.begin?.toJSDate()
            rangeEnd = val.end?.toJSDate()
          } else if ((val.begin?.constructor || val.end?.constructor) === Number) {
            rangeStart = val.begin
            rangeEnd = val.end
          }

          const excludeEnd = val.excludeEnd

          if (rangeStart && rangeEnd) {
            a = attr
            b = '>='
            c = rangeStart
            a2 = attr
            b2 = excludeEnd ? '<' : '<='
            c2 = rangeEnd
          } else if (rangeStart) {
            a = attr
            b = '>='
            c = rangeStart
          } else {
            a = attr
            b = excludeEnd ? '<' : '<='
            c = rangeEnd
          }
        } else {
          a = attr
          b = '='
          c = val
        }

        if (negate) {
          // @ts-ignore
          const negatedB = OPERATION_NEGATION_MAP[b]
          if (!negatedB) throw `no negation available for comparison operator ${b}`
          query = query.where(a, negatedB, c)

          if (b2) {
            // @ts-ignore
            const negatedB2 = OPERATION_NEGATION_MAP[b2]
            if (!negatedB2) throw `no negation available for comparison operator ${b2}`
            query.where(a2, negatedB2, c2)
          }
        } else {
          query = query.where(a, b, c)
          if (b2) query = query.where(a2, b2, c2)
        }
      })

    return query
  }

  private recursivelyApplyJoinWhereStatement<PreviousTableName extends AssociationTableNames>(
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>,
    whereJoinsStatement:
      | JoinsWhereAssociationExpression<PreviousTableName, AssociationExpression<PreviousTableName, any>>
      | Updateable<DB[PreviousTableName]>,
    previousAssociationTableOrAlias: string
  ) {
    for (const key of Object.keys(whereJoinsStatement) as (
      | keyof SyncedAssociations[PreviousTableName]
      | keyof Updateable<DB[PreviousTableName]>
    )[]) {
      const columnValue = (whereJoinsStatement as Updateable<DB[PreviousTableName]>)[
        key as keyof Updateable<DB[PreviousTableName]>
      ]

      if (columnValue!.constructor !== Object) {
        query = (this as any).applyWhereStatement(query, {
          [`${previousAssociationTableOrAlias}.${String(key)}`]: columnValue,
        })
      } else {
        let currentAssociationTableOrAlias = key as
          | (keyof SyncedAssociations[PreviousTableName] & string)
          | string

        query = this.recursivelyApplyJoinWhereStatement<any>(
          query,
          // @ts-ignore
          whereJoinsStatement[currentAssociationTableOrAlias],
          currentAssociationTableOrAlias
        )
      }
    }

    return query
  }

  private buildCommon<T extends Query<DreamClass>>(this: T, query: any) {
    this.conditionallyApplyScopes()

    if (this.joinsStatements.length) {
      query = this.recursivelyJoin({
        query,
        joinsStatement: this.joinsStatements as any,
        dreamClass: this.dreamClass,
        previousAssociationTableOrAlias: this.dreamClass.prototype.table as InstanceType<DreamClass>['table'],
      })
    }

    this.orStatements.forEach(orStatement => {
      query = query.union(orStatement.toKysely() as any)
    })

    if (Object.keys(this.whereStatement).length) {
      query = this.applyWhereStatement(
        query,
        this.aliasWhereStatement(this.whereStatement, this.dreamClass.prototype.table)
      )
    }

    if (Object.keys(this.whereNotStatement).length) {
      query = this.applyWhereStatement(
        query,
        this.aliasWhereStatement(this.whereNotStatement, this.dreamClass.prototype.table),
        {
          negate: true,
        }
      )
    }

    this.whereJoinsStatement.forEach(whereJoinsStatement => {
      query = this.recursivelyApplyJoinWhereStatement(query, whereJoinsStatement, '')
    })

    return query
  }

  private aliasWhereStatement(
    whereStatements: WhereStatement<InstanceType<DreamClass>['table']>[],
    alias: string
  ) {
    return whereStatements.map(whereStatement => {
      const aliasedWhere: any = {}
      Object.keys(whereStatement).forEach((key: any) => {
        aliasedWhere[`${alias}.${key}`] = (whereStatement as any)[key]
      })
      return aliasedWhere
    })
  }

  private buildDelete<T extends Query<DreamClass>>(
    this: T
  ): DeleteQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}> {
    let query = this.db.deleteFrom(this.dreamClass.prototype.table as InstanceType<DreamClass>['table'])
    return this.buildCommon(query)
  }

  private buildSelect<T extends Query<DreamClass>>(
    this: T,
    { bypassSelectAll = false }: { bypassSelectAll?: boolean } = {}
  ): SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}> {
    let query = this.db.selectFrom(this.dreamClass.prototype.table as InstanceType<DreamClass>['table'])

    query = this.buildCommon(query)

    if (this.orderStatement)
      query = query.orderBy(this.orderStatement.column as any, this.orderStatement.direction)

    if (this.limitStatement) query = query.limit(this.limitStatement.count)

    if (!bypassSelectAll)
      query = query.selectAll(
        this.dreamClass.prototype.table as ExtractTableAlias<DB, InstanceType<DreamClass>['table']>
      )

    return query
  }

  public buildUpdate<T extends Query<DreamClass>>(
    this: T,
    attributes: Updateable<InstanceType<DreamClass>['table']>
  ): UpdateQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, any, {}> {
    let query = this.db
      .updateTable(this.dreamClass.prototype.table as InstanceType<DreamClass>['table'])
      .set(attributes as any)
    return this.buildCommon(query)
  }
}
