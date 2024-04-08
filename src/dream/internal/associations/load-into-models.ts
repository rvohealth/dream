import { RelaxedPreloadStatement } from '../../types'
import Dream from '../../../dream'
import Query from '../../query'
import { PassthroughWhere } from '../../../decorators/associations/shared'
import { HasManyStatement } from '../../../decorators/associations/has-many'
import { HasOneStatement } from '../../../decorators/associations/has-one'
import { BelongsToStatement } from '../../../decorators/associations/belongs-to'
import CannotAssociateThroughPolymorphic from '../../../exceptions/associations/cannot-associate-through-polymorphic'
import MissingThroughAssociation from '../../../exceptions/associations/missing-through-association'
import MissingThroughAssociationSource from '../../../exceptions/associations/missing-through-association-source'
import compact from '../../../helpers/compact'
import debug from '../../../../shared/helpers/debug'
import { singular } from 'pluralize'

export default class LoadIntoModels<
  DreamClass extends typeof Dream,
  DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>,
  DB extends DreamInstance['DB'] = DreamInstance['DB'],
  SyncedAssociations extends DreamInstance['syncedAssociations'] = DreamInstance['syncedAssociations'],
> {
  private readonly preloadStatements: RelaxedPreloadStatement
  private readonly passthroughWhereStatement: PassthroughWhere | null = null

  constructor(preloadStatements: RelaxedPreloadStatement, passthroughWhereStatement: PassthroughWhere) {
    this.preloadStatements = preloadStatements
    this.passthroughWhereStatement = passthroughWhereStatement
  }

  public async loadInto(models: Dream[]) {
    await this.applyPreload(this.preloadStatements, models)
  }

  private async applyPreload(preloadStatement: RelaxedPreloadStatement, dream: Dream | Dream[]) {
    for (const key of Object.keys(preloadStatement as any)) {
      const nestedDream = await this.applyOnePreload(key, dream)
      if (nestedDream) {
        await this.applyPreload((preloadStatement as any)[key], nestedDream)
      }
    }
  }

  private async applyOnePreload(currentAssociationTableOrAlias: string, dreams: Dream | Dream[]) {
    if (!Array.isArray(dreams)) dreams = [dreams as Dream]

    const dream = dreams.find(dream => dream.associationMap()[currentAssociationTableOrAlias])!
    if (!dream) return

    let association = dream.associationMap()[currentAssociationTableOrAlias]
    let associationQuery: any // typeof Dream | Query<any>

    const originalAssociation = association
    const results = await this.preloadBridgeThroughAssociations(
      dream.constructor as typeof Dream,
      dreams,
      association
    )
    dreams = results.dreams
    if (dreams.length === 0) return
    association = results.association

    if (association.type === 'BelongsTo') {
      if (association.polymorphic) {
        // Rating polymorphically BelongsTo Composition and Post
        // for each of Composition and Post
        for (const associatedModel of association.modelCB() as (typeof Dream)[]) {
          const relevantAssociatedModels = dreams.filter((dream: any) => {
            return (
              (dream as any)[association.foreignKeyTypeField()] ===
              associatedModel['stiBaseClassOrOwnClass'].name
            )
          })

          if (relevantAssociatedModels.length) {
            // associationQuery = this.dreamTransaction
            //   ? associatedModel.txn(this.dreamTransaction)
            //   : associatedModel
            associationQuery = associatedModel
            if (this.passthroughWhereStatement)
              associationQuery = associationQuery.passthrough(this.passthroughWhereStatement)

            associationQuery = associationQuery.where({
              [association.primaryKey()]: relevantAssociatedModels.map(
                (dream: any) => (dream as any)[association.foreignKey()]
              ),
            })

            this.hydrateAssociation(dreams, association, await associationQuery.all())
          }
        }
      } else {
        const associatedModel = association.modelCB() as typeof Dream
        // associationQuery = this.dreamTransaction
        //   ? associatedModel.txn(this.dreamTransaction)
        //   : associatedModel
        associationQuery = associatedModel
        if (this.passthroughWhereStatement)
          associationQuery = associationQuery.passthrough(this.passthroughWhereStatement)

        associationQuery = associationQuery.where({
          [association.primaryKey()]: dreams.map(dream => (dream as any)[association.foreignKey()]),
        })

        associationQuery = this.bridgeOriginalPreloadAssociation(originalAssociation, associationQuery)

        this.hydrateAssociation(dreams, association, await associationQuery.all())
      }
    } else {
      const associatedModel = association.modelCB() as typeof Dream
      // associationQuery = this.dreamTransaction ? associatedModel.txn(this.dreamTransaction) : associatedModel
      associationQuery = associatedModel
      if (this.passthroughWhereStatement)
        associationQuery = associationQuery.passthrough(this.passthroughWhereStatement)

      associationQuery = associationQuery.where({
        [association.foreignKey()]: dreams.map(dream => association.primaryKeyValue(dream)),
      })

      // REMOVING THIS BECAUSE WE NEED TO MATCH DIFFERENT POLYMORPHIC MODELS. CHECK TYPES DURING ASSOCIATION, NOT QUERY
      // if (association.polymorphic) {
      //   associationQuery = associationQuery.where({
      //     [association.foreignKeyTypeField()]: dream['stiBaseClassOrOwnClass'].name as any,
      //   })
      // }
      // end: REMOVING THIS BECAUSE WE NEED TO MATCH DIFFERENT POLYMORPHIC MODELS. CHECK TYPES DURING ASSOCIATION, NOT QUERY

      if (association.where) {
        debug(`
applying where clause for association:
${JSON.stringify(association, null, 2)}
        `)
      }
      if (association.where) associationQuery = associationQuery.where(association.where)

      if (association.whereNot) {
        debug(`
applying whereNot clause for association:
${JSON.stringify(association, null, 2)}
        `)
      }
      if (association.whereNot) associationQuery = associationQuery.whereNot(association.whereNot)

      if ((association as any).distinct) {
        debug(`
applying distinct clause for association:
${JSON.stringify(association, null, 2)}
        `)
      }
      if ((association as any).distinct) {
        associationQuery = associationQuery.distinct((association as any).distinct)
      }

      associationQuery = this.bridgeOriginalPreloadAssociation(originalAssociation, associationQuery)

      this.hydrateAssociation(dreams, association, await associationQuery.all())
    }

    return compact(dreams.flatMap(dream => (dream as any)[association.as]))
  }

  private bridgeOriginalPreloadAssociation(
    originalAssociation:
      | HasOneStatement<any, DB, SyncedAssociations, any>
      | HasManyStatement<any, DB, SyncedAssociations, any>
      | BelongsToStatement<any, DB, SyncedAssociations, any>,
    associationQuery: Query<any>
  ) {
    if ((originalAssociation as any)?.through) {
      const assoc = originalAssociation as
        | HasManyStatement<any, any, any, string>
        | HasOneStatement<any, any, any, string>

      if (assoc.where) {
        associationQuery = associationQuery.where(assoc.where)
      }

      if (assoc.whereNot) {
        associationQuery = associationQuery.whereNot(assoc.whereNot)
      }
    }

    return associationQuery
  }

  private async preloadBridgeThroughAssociations(
    dreamClass: typeof Dream,
    dreams: Dream[],
    association:
      | HasOneStatement<any, DB, SyncedAssociations, any>
      | HasManyStatement<any, DB, SyncedAssociations, any>
      | BelongsToStatement<any, DB, SyncedAssociations, any>
  ): Promise<{
    dreams: Dream[]
    association:
      | HasOneStatement<any, DB, SyncedAssociations, any>
      | HasManyStatement<any, DB, SyncedAssociations, any>
      | BelongsToStatement<any, DB, SyncedAssociations, any>
  }> {
    if (association.type === 'BelongsTo' || !association.through) {
      return { dreams: compact(dreams), association }
    } else {
      // Post has many Commenters through Comments
      // hydrate Post Comments
      await this.applyOnePreload(association.through, dreams)

      // return:
      //  Comments,
      //  the Comments -> CommentAuthors hasMany association
      // So that Comments may be properly hydrated with many CommentAuthors
      const newDreams = (dreams as any[]).flatMap(dream => dream[association.through!])
      const newAssociation = this.followThroughAssociation(dreamClass, association)

      return await this.preloadBridgeThroughAssociations(dreamClass, newDreams, newAssociation)
    }
  }

  private followThroughAssociation(
    dreamClass: typeof Dream,
    association:
      | HasOneStatement<any, DB, SyncedAssociations, any>
      | HasManyStatement<any, DB, SyncedAssociations, any>
  ) {
    const throughAssociation = association.through && dreamClass.associationMap()[association.through]
    if (!throughAssociation)
      throw new MissingThroughAssociation({
        dreamClass,
        association,
      })

    const throughClass = throughAssociation.modelCB() as typeof Dream
    if (Array.isArray(throughClass))
      throw new CannotAssociateThroughPolymorphic({
        dreamClass,
        association,
      })

    const newAssociation = getSourceAssociation(throughClass, association.source)
    if (!newAssociation)
      throw new MissingThroughAssociationSource({
        dreamClass,
        throughClass,
        association,
      })

    return newAssociation
  }

  public hydrateAssociation(
    dreams: Dream[],
    association:
      | HasManyStatement<any, DB, SyncedAssociations, any>
      | HasOneStatement<any, DB, SyncedAssociations, any>
      | BelongsToStatement<any, DB, SyncedAssociations, any>,
    loadedAssociations: Dream[]
  ) {
    switch (association.type) {
      case 'HasMany':
        dreams.forEach((dream: any) => {
          if (dream.loaded(association.as)) return // only overwrite if this hasn't yet been preloaded
          dream[association.as] = []
        })
        break
      default:
        dreams.forEach((dream: any) => {
          if (dream.loaded(association.as)) return // only overwrite if this hasn't yet been preloaded
          dream[`__${association.as}__`] = null
        })
    }

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
                dream[association.foreignKeyTypeField()] ===
                  loadedAssociation['stiBaseClassOrOwnClass'].name &&
                dream[association.foreignKey()] === association.primaryKeyValue(loadedAssociation)
              )
            } else {
              return dream[association.foreignKey()] === association.primaryKeyValue(loadedAssociation)
            }
          })
          .forEach((dream: any) => {
            if (dream[association.as]) return // only overwrite if this hasn't yet been preloaded
            dream[association.as] = loadedAssociation
          })
      } else {
        dreams
          .filter(dream => {
            if (association.polymorphic) {
              return (
                (loadedAssociation as any)[association.foreignKeyTypeField()] ===
                  dream['stiBaseClassOrOwnClass'].name &&
                (loadedAssociation as any)[association.foreignKey()] === association.primaryKeyValue(dream)
              )
            } else {
              return (
                (loadedAssociation as any)[association.foreignKey()] === association.primaryKeyValue(dream)
              )
            }
          })
          .forEach((dream: any) => {
            if (association.type === 'HasMany') {
              if (Object.isFrozen(dream[association.as])) return // only overwrite if this hasn't yet been preloaded
              dream[association.as].push(loadedAssociation)
            } else {
              if (dream[association.as]) return // only overwrite if this hasn't yet been preloaded
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
}

function getSourceAssociation(dream: Dream | typeof Dream | undefined, sourceName: string) {
  if (!dream) return
  if (!sourceName) return
  return (
    (dream as Dream).associationMap()[sourceName] || (dream as Dream).associationMap()[singular(sourceName)]
  )
}
