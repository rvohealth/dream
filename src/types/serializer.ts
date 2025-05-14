import Dream from '../Dream.js'
import { RoundingPrecision } from '../helpers/round.js'
import { DreamSerializerBuilder } from '../serializer/index.js'
import {
  DreamOrViewModelClassSerializerArrayKeys,
  DreamOrViewModelClassSerializerKey,
  DreamSerializable,
  DreamSerializableArray,
  ViewModelClass,
} from './dream.js'
import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from './openapi.js'

export type DreamSerializerCallback = () => SerializerType
export type SerializableClassOrSerializerCallback = ViewModelClass | DreamSerializerCallback

export type SerializableClassOrClasses = DreamSerializerCallback | ViewModelClass | ViewModelClass[]

export interface SerializerAttribute<
  DataType,
  AttributeName extends keyof Exclude<DataType, null> & string = keyof Exclude<DataType, null> & string,
> {
  name: AttributeName
  openapi:
    | ExtraOpenapiOptionsForAutomaticallySetOpenapi
    | OpenapiSchemaBodyShorthand
    | OpenapiShorthandPrimitiveTypes
    | undefined
  renderOptions: DecimalShorthandAttributeRenderOptions | undefined
}

export interface SerializerDelegatedAttribute<
  DataType,
  TargetName extends keyof Exclude<DataType, null> & string = keyof Exclude<DataType, null> & string,
  TargetObject extends Exclude<DataType, null>[TargetName] = Exclude<DataType, null>[TargetName],
  AttributeName extends TargetObject extends object
    ? keyof TargetObject & string
    : never = TargetObject extends object ? keyof TargetObject & string : never,
> {
  targetName: TargetName
  name: AttributeName
  openapi:
    | ExtraOpenapiOptionsForAutomaticallySetOpenapi
    | OpenapiSchemaBodyShorthand
    | OpenapiShorthandPrimitiveTypes
    | undefined
  renderOptions: DecimalShorthandAttributeRenderOptions | undefined
}

export interface SerializerAttributeFunction {
  name: string
  fn: (x?: any, y?: any) => any
  openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined
}

export interface SerializerRendersOne<
  DataType,
  AttributeName extends keyof Exclude<DataType, null> & string = keyof Exclude<DataType, null> & string,
> {
  name: AttributeName
  options: RendersOneOpts<any>
  openapi: CustomSerializerOpenapiOpts
}

export interface SerializerRendersMany<
  DataType,
  AttributeName extends keyof Exclude<DataType, null> & string = keyof Exclude<DataType, null> & string,
> {
  name: AttributeName
  options: RendersManyOpts<any>
  openapi: CustomSerializerOpenapiOpts
}

export interface ExtraOpenapiOptionsForAutomaticallySetOpenapi {
  description?: string
}
export interface AttributeRenderOptions {
  as?: string
}
export interface DecimalShorthandAttributeRenderOptions extends AttributeRenderOptions {
  precision?: RoundingPrecision
}
export type SerializerType =
  | ((dreamClass: typeof Dream, $data: any, $passthroughData?: any) => DreamSerializerBuilder<any, any, any>)
  | (($data: any, $passthroughData?: any) => DreamSerializerBuilder<any, any, any>)

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

interface RendersOneOptsBase<I extends DreamSerializable | DreamSerializableArray | undefined = undefined>
  extends RendersOneOrManyOpts<I> {
  flatten?: boolean
}

export type RendersOneOpts<I extends DreamSerializable | DreamSerializableArray | undefined = undefined> =
  I extends typeof Dream ? RendersOneOptsBase<I> : RendersOneOptsBase<I> & { optional?: boolean }
