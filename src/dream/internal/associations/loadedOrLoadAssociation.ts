import Dream from '../../../Dream.js'
import {
  AssociationNameToDream,
  DreamBelongsToAssociationNames,
  DreamHasManyAssociationNames,
  DreamHasOneAssociationNames,
} from '../../../types/dream.js'
import DreamInstanceTransactionBuilder from '../../DreamInstanceTransactionBuilder.js'
import Query from '../../Query.js'

export default async function loadedOrLoadAssociation<
  DreamInstance extends Dream,
  DreamInstanceOrInstanceTransactionBuilder extends Dream | DreamInstanceTransactionBuilder<DreamInstance>,
  AssociationName extends
    | DreamBelongsToAssociationNames<DreamInstance>
    | DreamHasOneAssociationNames<DreamInstance>
    | DreamHasManyAssociationNames<DreamInstance>,
  ReturnType extends AssociationName extends DreamHasManyAssociationNames<DreamInstance>
    ? AssociationNameToDream<DreamInstance, AssociationName>[]
    : AssociationNameToDream<DreamInstance, AssociationName> | null,
>(
  dream: DreamInstance,
  dreamOrTransactionBuilder: DreamInstanceOrInstanceTransactionBuilder,
  associationName: AssociationName,
  options?: { passthrough?: Record<string, string>; required?: Record<string, string> }
) {
  if (!dream.loaded(associationName)) {
    const association = dream['getAssociationMetadata'](associationName)
    const associationQueryOptions = options?.required && { and: options.required }
    let scope = (dreamOrTransactionBuilder as any).associationQuery(
      associationName as any,
      associationQueryOptions as any
    ) as Query<DreamInstance>

    if (options?.passthrough) scope = scope.passthrough(options.passthrough)

    if (association?.type === 'HasMany') {
      dream[associationName] = (await scope.all()) as any
    } else {
      dream[associationName] = (await scope.first()) as any
    }
  }

  return dream[associationName] as ReturnType
}
