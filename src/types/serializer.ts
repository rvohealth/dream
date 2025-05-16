import Dream from '../Dream.js'
import { RoundingPrecision } from '../helpers/round.js'
import {
  DreamSerializerBuilder,
  SimpleObjectSerializerBuilder,
  ViewModelSerializerBuilder,
} from '../serializer/index.js'
import {
  DreamAttributeDbTypes,
  DreamOrViewModelClassSerializerArrayKeys,
  DreamOrViewModelClassSerializerKey,
  DreamSerializable,
  DreamSerializableArray,
  ViewModelClass,
} from './dream.js'
import {
  DecimalOpenapiTypesIncludingDbTypes,
  OpenapiDescription,
  OpenapiSchemaBodyShorthand,
  OpenapiShorthandPrimitiveTypes,
} from './openapi.js'

export type DreamsOrSerializersOrViewModels = DreamSerializable | DreamSerializableArray

export type DreamSerializerCallback = () => SerializerType

export type SerializableClassOrSerializerCallback = ViewModelClass | DreamSerializerCallback

export type SerializableClassOrClasses = DreamSerializerCallback | ViewModelClass | ViewModelClass[]

export interface SerializerAttribute<> {
  name: string
  options: {
    as?: string
    precision?: RoundingPrecision
    openapi?: OpenapiDescription | OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes
  }
}

export interface SerializerDelegatedAttribute<> {
  targetName: string
  name: string
  options: NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption
}

export interface SerializerCustomAttribute {
  name: string
  fn: (x?: any, y?: any) => any
  options: Exclude<NonAutomaticSerializerAttributeOptions, 'as'>
}

export interface SerializerRendersOne<
  DataType,
  AttributeName extends keyof DataType & string = keyof DataType & string,
> {
  name: AttributeName
  options: RendersOneOpts<any> & {
    openapi?: CustomSerializerOpenapiOpts
  }
}

export interface SerializerRendersMany<
  DataType,
  AttributeName extends keyof DataType & string = keyof DataType & string,
> {
  name: AttributeName
  options: RendersManyOpts<any> & {
    openapi?: CustomSerializerOpenapiOpts
  }
}

export type AutomaticSerializerAttributeOptions<
  DreamInstance extends Dream,
  AttributeName extends keyof DreamInstance & string,
> = {
  as?: string
  openapi?: OpenapiDescription
} & DreamAttributeDbTypes<DreamInstance>[AttributeName] extends DecimalOpenapiTypesIncludingDbTypes
  ? {
      precision?: RoundingPrecision
    }
  : object

export type NonAutomaticSerializerAttributeOptions = {
  as?: string
} & {
  openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes
}

export type NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption = {
  as?: string
} & {
  openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes
  // I tried a lot to get this type to disallow precision unless openapi were decimal/decimal[], but
  // it always allowed decimal even with { openapi: 'string', precision: 7 },
  // so I'm keeping it simple (some of what I tried removed decimal/decimal[] as a suggested type for
  // openapi, which is undesirable)
  precision?: RoundingPrecision
}

export type DreamModelSerializerType = (
  dreamClass: any,
  $data: any,
  $passthroughData?: any
) => DreamSerializerBuilder<any, any, any>

export type ViewModelSerializerType = (
  viewModelClass: any,
  $data: any,
  $passthroughData?: any
) => ViewModelSerializerBuilder<any, any, any>

export type SimpleModelSerializerType = (
  $data: any,
  $passthroughData?: any
) => SimpleObjectSerializerBuilder<any, any>

export type SerializerType = DreamModelSerializerType | ViewModelSerializerType | SimpleModelSerializerType

export interface CustomSerializerOpenapiOpts {
  customSerializerRefPath?: string
}

export interface RendersOneOrManyOpts<
  I extends DreamSerializable | DreamSerializableArray | undefined = undefined,
> {
  as?: string
  serializer?: SerializableClassOrSerializerCallback

  serializerKey?: I extends undefined
    ? never
    : I extends DreamSerializableArray
      ? DreamOrViewModelClassSerializerArrayKeys<I>
      : I extends typeof Dream | ViewModelClass
        ? DreamOrViewModelClassSerializerKey<I>
        : never
}

export interface RendersManyOpts<I extends DreamSerializable | DreamSerializableArray | undefined = undefined>
  extends RendersOneOrManyOpts<I> {}

export interface RendersOneOptsBase<
  I extends DreamSerializable | DreamSerializableArray | undefined = undefined,
> extends RendersOneOrManyOpts<I> {
  flatten?: boolean
}

export type RendersOneOpts<I extends DreamSerializable | DreamSerializableArray | undefined = undefined> =
  I extends typeof Dream ? RendersOneOptsBase<I> : RendersOneOptsBase<I> & { optional?: boolean }
