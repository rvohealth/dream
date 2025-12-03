import yoctocolors from 'yoctocolors'
import { indent } from '../../helpers/indent.js'
import {
  DreamModelSerializerType,
  InternalAnyTypedSerializerDelegatedAttribute,
  InternalAnyTypedSerializerRendersMany,
  InternalAnyTypedSerializerRendersOne,
  SimpleObjectSerializerType,
} from '../../types/serializer.js'

export default function printSerializerHierarchyLevel({
  serializerAssociationType,
  serializerAssociationName,
  associationSerializer,
  forDisplayDepth,
}: {
  serializerAssociationType: (
    | InternalAnyTypedSerializerRendersMany<any>
    | InternalAnyTypedSerializerRendersOne<any>
    | InternalAnyTypedSerializerDelegatedAttribute
  )['type']
  serializerAssociationName: string
  associationSerializer: DreamModelSerializerType | SimpleObjectSerializerType
  forDisplayDepth: number
}) {
  const hierarchyLine = '└───'
  const indentation = indent((hierarchyLine.length + 1) * forDisplayDepth, {
    tabWidth: 1,
  })
  const prefix = `${hierarchyLine} `
  const nestedAssociationDisplay =
    indentation + `${prefix}${serializerAssociationType} ${yoctocolors.cyan(serializerAssociationName)}`

  // eslint-disable-next-line no-console
  console.log(nestedAssociationDisplay)

  // eslint-disable-next-line no-console
  console.log(
    yoctocolors.gray(
      indentation +
        indent(prefix.length, { tabWidth: 1 }) +
        (associationSerializer as unknown as Record<'globalName', string>).globalName
    )
  )
}
