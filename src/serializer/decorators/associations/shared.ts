import Dream from '../../../Dream.js'
import { DreamConst } from '../../../dream/constants.js'
import { DreamAssociationNames, SerializableClassOrClasses } from '../../../types/dream.js'
import hasSerializersGetter from '../helpers/hasSerializersGetter.js'
import maybeSerializableToDreamSerializerCallbackFunction from '../helpers/maybeSerializableToDreamSerializerCallbackFunction.js'

export type SerializableAssociationType = 'RendersOne' | 'RendersMany'

export interface DreamSerializerAssociationStatement {
  field: string
  flatten: boolean
  optional: boolean
  dreamOrSerializerClass: SerializableClassOrClasses | null
  source: string | typeof DreamConst.passthrough
  through: string | null
  type: SerializableAssociationType
  path: string | null
  exportedAs: string | null
  serializerKey?: string
}

export interface RendersOneOrManyOpts<
  DreamClass extends typeof Dream | undefined = undefined,
  AssocNameOrString = DreamClass extends typeof Dream
    ? DreamAssociationNames<InstanceType<DreamClass>>
    : string,
> {
  optional?: boolean
  source?: AssocNameOrString | typeof DreamConst.passthrough
  through?: AssocNameOrString
  path?: string
  exportedAs?: string
  serializerKey?: string
}

export function isSerializable(dreamOrSerializerClass: any) {
  return (
    Array.isArray(dreamOrSerializerClass) ||
    hasSerializersGetter(dreamOrSerializerClass) ||
    !!maybeSerializableToDreamSerializerCallbackFunction(dreamOrSerializerClass)
  )
}
