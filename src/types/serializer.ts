import Dream from '../Dream.js'
import { RoundingPrecision } from '../helpers/round.js'
import { DreamSerializerBuilder } from '../serializer/index.js'
import {
  DreamAttributeDbTypes,
  DreamOrViewModelClassSerializerArrayKeys,
  DreamOrViewModelClassSerializerKey,
  DreamSerializable,
  DreamSerializableArray,
  ViewModelClass,
} from './dream.js'
import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from './openapi.js'

export type DreamsOrSerializersOrViewModels = DreamSerializable | DreamSerializableArray

export type DreamSerializerCallback = () => SerializerType
export type SerializableClassOrSerializerCallback = ViewModelClass | DreamSerializerCallback

export type SerializableClassOrClasses = DreamSerializerCallback | ViewModelClass | ViewModelClass[]

export interface SerializerAttribute<
  DataType,
  AttributeName extends keyof DataType & string = keyof DataType & string,
> {
  name: AttributeName
  options: {
    as?: string
    openapi?: OpenapiDescription | OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes
  } & DecimalRenderOption
}

export interface SerializerDelegatedAttribute<
  DataType,
  TargetName extends keyof DataType & string = keyof DataType & string,
  TargetObject extends DataType[TargetName] = DataType[TargetName],
  AttributeName extends TargetObject extends object
    ? keyof TargetObject & string
    : never = TargetObject extends object ? keyof TargetObject & string : never,
> {
  targetName: TargetName
  name: AttributeName
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

export interface OpenapiDescription {
  description?: string
}

export type DecimalOpenapiTypes =
  | 'decimal'
  | 'decimal[]'
  | ['decimal', 'null']
  | ['decimal[]', 'null']
  | 'numeric'
  | 'numeric[]'
  | ['numeric', 'null']
  | ['numeric[]', 'null']

export interface DecimalRenderOption {
  precision?: RoundingPrecision
}

export type AutomaticSerializerAttributeOptions<
  DreamInstance extends Dream,
  AttributeName extends keyof DreamInstance & string,
> = {
  as?: string
  openapi?: OpenapiDescription
} & DreamAttributeDbTypes<DreamInstance>[AttributeName] extends DecimalOpenapiTypes
  ? DecimalRenderOption
  : object

export type NonAutomaticSerializerAttributeOptions = {
  as?: string
} & {
  openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes
}

export type NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption = {
  as?: string
} & (
  | {
      openapi: Exclude<OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes, DecimalOpenapiTypes>
    }
  | ({
      openapi: OpenapiDescription & DecimalOpenapiTypes
    } & DecimalRenderOption)
)

export type SerializerType =
  | ((
      dreamClass: typeof Dream,
      $data: any,
      $passthroughData?: any
    ) =>
      | DreamSerializerBuilder<any, any, any>
      | ViewModelSerializerBuilder<any, any, any>
      | SimpleObjectSerializerBuilder<any, any>)
  | ((
      $data: any,
      $passthroughData?: any
    ) =>
      | DreamSerializerBuilder<any, any, any>
      | ViewModelSerializerBuilder<any, any, any>
      | SimpleObjectSerializerBuilder<any, any>)

export interface CustomSerializerOpenapiOpts {
  customSerializerRefPath?: string
}

export interface RendersOneOrManyOpts<
  I extends DreamSerializable | DreamSerializableArray | undefined = undefined,
> {
  as?: string
  serializer?: DreamSerializerCallback

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
