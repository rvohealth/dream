import { BelongsToStatement } from '../../decorators/associations/belongs-to'
import { WhereStatement } from '../../decorators/associations/shared'
import Dream from '../../dream'
import CanOnlyPassBelongsToModelParam from '../../exceptions/associations/can-only-pass-belongs-to-model-param'
import CannotPassNullOrUndefinedToRequiredBelongsTo from '../../exceptions/associations/cannot-pass-null-or-undefined-to-required-belongs-to'
import { marshalDBValue } from '../../helpers/marshalDBValue'
import { UpdateablePropertiesForClass } from '../types'

export default function extractAttributesFromUpdateableProperties<T extends typeof Dream>(
  dreamClass: T,
  attributes: UpdateablePropertiesForClass<T>,
  dreamInstance?: InstanceType<T>
): WhereStatement<InstanceType<T>['DB'], InstanceType<T>['syncedAssociations'], InstanceType<T>['table']> {
  const marshalledOpts: any = {}

  Object.keys(attributes as any).forEach(attr => {
    const associationMetaData = dreamClass.associationMap()[attr]

    if (associationMetaData && associationMetaData.type !== 'BelongsTo') {
      throw new CanOnlyPassBelongsToModelParam(dreamClass, associationMetaData)
    } else if (associationMetaData) {
      const belongsToAssociationMetaData = associationMetaData as BelongsToStatement<any, any, any>
      const associatedObject = (attributes as any)[attr]

      // if dream instance is passed, set the loaded association
      if (dreamInstance && associatedObject !== undefined) (dreamInstance as any)[attr] = associatedObject

      if (!(associationMetaData as BelongsToStatement<any, any, any>).optional && !associatedObject)
        throw new CannotPassNullOrUndefinedToRequiredBelongsTo(
          dreamClass,
          associationMetaData as BelongsToStatement<any, any, any>
        )

      const foreignKey = belongsToAssociationMetaData.foreignKey()
      marshalledOpts[foreignKey] = associatedObject?.primaryKeyValue
      if (dreamInstance) {
        ;(dreamInstance as any)[foreignKey] = marshalledOpts[foreignKey]
      }

      if (belongsToAssociationMetaData.polymorphic) {
        const foreignKeyTypeField = belongsToAssociationMetaData.foreignKeyTypeField()
        marshalledOpts[foreignKeyTypeField] = associatedObject?.stiBaseClassOrOwnClass?.name
        if (dreamInstance) {
          ;(dreamInstance as any)[foreignKeyTypeField] = associatedObject?.stiBaseClassOrOwnClass?.name
        }
      }
    } else {
      // TODO: cleanup type chaos
      marshalledOpts[attr] = marshalDBValue(dreamClass, attr as any, (attributes as any)[attr])
      if (dreamInstance) {
        ;(dreamInstance as any)[attr] = marshalledOpts[attr]
      }
    }
  })

  return marshalledOpts
}
