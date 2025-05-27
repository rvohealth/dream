import Dream from '../Dream.js'
import { RoundingPrecision } from '../helpers/round.js'
import DreamSerializerBuilder from '../serializer/builders/DreamSerializerBuilder.js'
import ObjectSerializerBuilder from '../serializer/builders/ObjectSerializerBuilder.js'
import { DreamAttributeDbTypes, DreamSerializable, DreamSerializableArray, ViewModelClass } from './dream.js'
import {
  DecimalOpenapiTypesIncludingDbTypes,
  OpenapiDescription,
  OpenapiSchemaBodyShorthand,
  OpenapiShorthandPrimitiveTypes,
} from './openapi.js'

export type SerializerCasing = 'camel' | 'snake'
export type DreamsOrSerializersOrViewModels = DreamSerializable | DreamSerializableArray

export type DreamSerializerCallback<
  T extends typeof Dream | ViewModelClass | object | (typeof Dream)[] | ViewModelClass[] | object[],
> = () => SerializerType<T>

export interface InternalAnyTypedSerializerAttribute<> {
  name: string
  options: Partial<NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption>
}

export interface InternalAnyTypedSerializerDelegatedAttribute<> {
  targetName: string
  name: string
  options: NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption
}

export interface InternalAnyTypedSerializerCustomAttribute {
  name: string
  fn: (x?: any, y?: any) => any
  options: Omit<NonAutomaticSerializerAttributeOptions, 'as'> & { flatten?: boolean }
}

export interface InternalAnyRendersOneOrManyOpts {
  as?: string
  dreamClass?: typeof Dream
  viewModelClass?: ViewModelClass
  serializerCallback?: DreamSerializerCallback<any>
  serializerKey?: string
}

export interface InternalAnyTypedSerializerRendersOne<
  DataType,
  AttributeName extends keyof DataType & string = keyof DataType & string,
> {
  name: AttributeName
  options: InternalAnyRendersOneOrManyOpts & {
    flatten?: boolean
    optional?: boolean
  }
}

export interface InternalAnyTypedSerializerRendersMany<
  DataType,
  AttributeName extends keyof DataType & string = keyof DataType & string,
> {
  name: AttributeName
  options: InternalAnyRendersOneOrManyOpts
}

export type AutomaticSerializerAttributeOptions<
  DreamInstance extends Dream,
  AttributeName extends keyof DreamInstance & string,
> = {
  as?: string
  openapi?: OpenapiDescription
  precision?: DreamAttributeDbTypes<DreamInstance>[AttributeName] extends DecimalOpenapiTypesIncludingDbTypes
    ? RoundingPrecision
    : never
}

export type NonAutomaticSerializerAttributeOptions = {
  as?: string
  openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes
}

export type NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption =
  NonAutomaticSerializerAttributeOptions & {
    // I tried a lot to get this type to disallow precision unless openapi were decimal/decimal[], but
    // it always allowed decimal even with { openapi: 'string', precision: 7 },
    // so I'm keeping it simple (some of what I tried removed decimal/decimal[] as a suggested type for
    // openapi, which is undesirable)
    precision?: RoundingPrecision
  }

export type DreamModelSerializerType = (
  dreamClass: any,
  data: any,
  passthroughData?: any
) => DreamSerializerBuilder<any, any, any>

export type SimpleObjectSerializerType = (
  data: any,
  passthroughData?: any
) => ObjectSerializerBuilder<any, any>

export type SerializerType<T extends Dream | object | Dream[] | object[]> = T extends Dream | Dream[]
  ? DreamModelSerializerType
  : SimpleObjectSerializerType

export interface ReferencedSerializersAndOpenapiSchemaBodyShorthand {
  referencedSerializers: (DreamModelSerializerType | SimpleObjectSerializerType)[]
  openapi: OpenapiSchemaBodyShorthand
}

export interface ReferencedSerializersAndAttributes {
  referencedSerializers: (DreamModelSerializerType | SimpleObjectSerializerType)[]
  attributes: Record<string, OpenapiSchemaBodyShorthand>
}
