import { AssociationTableNames } from '../../db/reflections'
import Dream from '../../dream'
import {
  HasOptions,
  HasStatement,
  applyGetterAndSetter,
  associationPrimaryKeyAccessors,
  blankAssociationsFactory,
  finalForeignKey,
  foreignKeyTypeField,
  validateHasStatementArgs,
} from './shared'

export default function HasOne<
  BaseInstance extends Dream,
  AssociationDreamClass extends typeof Dream = typeof Dream,
>(
  modelCB: () => AssociationDreamClass,
  {
    cascade,
    foreignKey,
    order,
    polymorphic = false,
    preloadThroughColumns,
    primaryKeyOverride = null,
    selfWhere,
    selfWhereNot,
    source,
    through,
    where,
    whereNot,
  }: HasOneOptions<BaseInstance, AssociationDreamClass> = {}
): any {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function (target: BaseInstance, key: string, _: any) {
    const dreamClass: typeof Dream = (target as any).constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'associations'))
      dreamClass['associationMetadataByType'] = blankAssociationsFactory(dreamClass)

    validateHasStatementArgs({
      dreamClass,
      methodName: key,
      where,
      cascade,
    })

    const partialAssociation = associationPrimaryKeyAccessors(
      {
        modelCB,
        type: 'HasOne',
        as: key,
        polymorphic,
        source: source || key,
        through,
        preloadThroughColumns,
        where,
        whereNot,
        selfWhere,
        selfWhereNot,
        distinct: null,
        order,
        primaryKeyOverride,
        cascade,
      } as any,
      dreamClass
    )

    const association = {
      ...partialAssociation,
      foreignKey() {
        return finalForeignKey(foreignKey, dreamClass, partialAssociation)
      },
      foreignKeyTypeField() {
        return foreignKeyTypeField(foreignKey, dreamClass, partialAssociation)
      },
    } as HasOneStatement<any, any, any, any>

    dreamClass['associationMetadataByType']['hasOne'].push(association)
    applyGetterAndSetter(target, association)
  }
}

export interface HasOneStatement<
  BaseInstance extends Dream,
  DB,
  Schema,
  ForeignTableName extends AssociationTableNames<DB, Schema> & keyof DB,
> extends HasStatement<BaseInstance, DB, Schema, ForeignTableName, 'HasOne'> {}

export interface HasOneOptions<BaseInstance extends Dream, AssociationDreamClass extends typeof Dream>
  extends HasOptions<BaseInstance, AssociationDreamClass> {}
