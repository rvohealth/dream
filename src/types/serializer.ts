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

export interface InternalAnyTypedSerializerAttribute<> {
  type: 'attribute'
  name: string
  options: Partial<NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption>
}

export interface InternalAnyTypedSerializerDelegatedAttribute<> {
  type: 'delegatedAttribute'
  targetName: string
  name: string
  options: NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption
}

export interface InternalAnyTypedSerializerCustomAttribute {
  type: 'customAttribute'
  name: string
  fn: (x?: any, y?: any) => any
  options: Omit<NonAutomaticSerializerAttributeOptions, 'as'> & { flatten?: boolean }
}

export interface InternalAnyRendersOneOrManyOpts {
  as?: string
  dreamClass?: typeof Dream
  viewModelClass?: ViewModelClass
  serializer?: DreamModelSerializerType | SimpleObjectSerializerType
  serializerKey?: string
}

export interface InternalAnyTypedSerializerRendersOne<
  DataType,
  AttributeName extends keyof DataType & string = keyof DataType & string,
> {
  type: 'rendersOne'
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
  type: 'rendersMany'
  name: AttributeName
  options: InternalAnyRendersOneOrManyOpts
}

export type AutomaticSerializerAttributeOptions<
  DreamInstance extends Dream,
  AttributeName extends keyof DreamInstance & string,
> = {
  as?: string
  default?: any
  openapi?: OpenapiDescription
  precision?: DreamAttributeDbTypes<DreamInstance>[AttributeName] extends DecimalOpenapiTypesIncludingDbTypes
    ? RoundingPrecision
    : never
}

export type NonAutomaticSerializerAttributeOptions = {
  as?: string
  default?: any
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

export type DreamModelSerializerType = (data: any, passthroughData?: any) => DreamSerializerBuilder<any, any>

export type SimpleObjectSerializerType = (
  data: any,
  passthroughData?: any
) => ObjectSerializerBuilder<any, any>

export type SerializerType<T extends Dream | object | Dream[] | object[]> = T extends Dream | Dream[]
  ? DreamModelSerializerType
  : SimpleObjectSerializerType
