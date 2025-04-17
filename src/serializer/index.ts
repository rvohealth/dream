import DreamApplication from '../dream-application/index.js'
import Dream from '../Dream.js'
import { DreamConst } from '../dream/constants.js'
import GlobalNameNotSet from '../errors/dream-application/GlobalNameNotSet.js'
import MissingSerializer from '../errors/MissingSerializersDefinition.js'
import FailedToRenderThroughAssociationForSerializer from '../errors/serializers/FailedToRenderThroughAssociationForSerializer.js'
import CalendarDate from '../helpers/CalendarDate.js'
import camelize from '../helpers/camelize.js'
import compact from '../helpers/compact.js'
import { DateTime } from '../helpers/DateTime.js'
import inferSerializerFromDreamOrViewModel, {
  inferSerializerFromDreamClassOrViewModelClass,
} from '../helpers/inferSerializerFromDreamOrViewModel.js'
import round, { RoundingPrecision } from '../helpers/round.js'
import snakeify from '../helpers/snakeify.js'
import {
  SerializableClassOrSerializerCallback,
  SerializableDreamClassOrViewModelClass,
  SerializableDreamOrViewModel,
} from '../types/dream.js'
import { DreamSerializerAssociationStatement } from './decorators/associations/shared.js'
import { AttributeStatement } from './decorators/attribute.js'
import maybeSerializableToDreamSerializerCallbackFunction from './decorators/helpers/maybeSerializableToDreamSerializerCallbackFunction.js'

export default class DreamSerializer<DataType = any, PassthroughDataType = any> {
  public static attributeStatements: AttributeStatement[] = []
  public static associationStatements: DreamSerializerAssociationStatement[] = []
  public static readonly isDreamSerializer = true

  private static _globalName: string

  /**
   * @internal
   *
   * Certain features (e.g. building OpenAPI specs from Attribute and RendersOne/Many decorators)
   * need static access to things set up by decorators. Stage 3 Decorators change the context that is available
   * at decoration time such that the class of a property being decorated is only avilable during instance instantiation. In order
   * to only apply static values once, on boot, `globallyInitializingDecorators` is set to true on DreamSerializer, and all serializers are instantiated.
   *
   */
  private static globallyInitializingDecorators: boolean = false

  public static get globalName(): string {
    if (!this._globalName) throw new GlobalNameNotSet(this)
    return this._globalName
  }

  private static setGlobalName(globalName: string) {
    this._globalName = globalName
  }

  public static get openapiName(): string {
    // TODO: make this customizable by the user
    const pathDelimiter = '_'

    return this.name.replace(/Serializer$/, '').replace(/\//g, pathDelimiter)
  }

  public static render(data: any, opts: DreamSerializerStaticRenderOpts = {}) {
    return new this(data).passthrough(opts.passthrough).render()
  }

  public static renderArray(dataArr: any[], opts: DreamSerializerStaticRenderOpts = {}) {
    return dataArr.map(data => this.render(data, opts))
  }

  public static getAssociatedSerializersForOpenapi(
    associationStatement: DreamSerializerAssociationStatement
  ): (typeof DreamSerializer<any, any>)[] | null {
    const serializer = maybeSerializableToDreamSerializerCallbackFunction(
      associationStatement.dreamOrSerializerClass
    )
    if (serializer) return [serializer()]

    let classOrClasses =
      associationStatement.dreamOrSerializerClass as SerializableClassOrSerializerCallback[]
    if (!classOrClasses) return null

    if (!Array.isArray(classOrClasses)) {
      classOrClasses = [classOrClasses]
    }

    return compact(
      classOrClasses.map(klass =>
        inferSerializerFromDreamClassOrViewModelClass(
          klass as SerializableDreamClassOrViewModelClass,
          associationStatement.serializerKey
        )
      )
    )
  }

  private static getAssociatedSerializerDuringRender(
    associatedData: SerializableDreamOrViewModel,
    associationStatement: DreamSerializerAssociationStatement
  ): typeof DreamSerializer<any, any> | null {
    const dreamSerializerCallbackFunctionOrNull = maybeSerializableToDreamSerializerCallbackFunction(
      associationStatement.dreamOrSerializerClass
    )

    if (dreamSerializerCallbackFunctionOrNull) return dreamSerializerCallbackFunctionOrNull()
    return inferSerializerFromDreamOrViewModel(associatedData, associationStatement.serializerKey)
  }

  private _data: DataType
  private _casing: 'snake' | 'camel' | null = null
  public readonly isDreamSerializerInstance = true

  constructor(data: DataType) {
    this._data = data

    const serializerPrototype = Object.getPrototypeOf(this)
    const attributeStatements = [...(this.constructor as typeof DreamSerializer).attributeStatements]

    attributeStatements.forEach(attributeStatement => {
      if (!attributeStatement.functional) {
        if (!Object.getOwnPropertyDescriptor(serializerPrototype, attributeStatement.field)?.get) {
          Object.defineProperty(serializerPrototype, attributeStatement.field, {
            get() {
              return this.$data[attributeStatement.field]
            },

            set(val: any) {
              this.$data[attributeStatement.field] = val
            },
          })
        }
      }
    })
  }

  public get $data() {
    return this._data
  }

  public get attributes() {
    const attributes = [...(this.constructor as typeof DreamSerializer).attributeStatements.map(s => s.field)]

    switch (this._casing) {
      case 'camel':
        return attributes.map(attr => camelize(attr))
      case 'snake':
        return attributes.map(attr => snakeify(attr))
      default:
        return attributes
    }
  }

  public casing(casing: 'snake' | 'camel') {
    this._casing = casing
    return this
  }

  protected $passthroughData: PassthroughDataType = {} as any
  public passthrough(obj: PassthroughDataType) {
    this.$passthroughData = {
      ...this.$passthroughData,
      ...obj,
    }
    return this
  }

  public absorbPassthrough(serializer: DreamSerializer) {
    this.passthrough(serializer.$passthroughData)
    return this
  }

  public render(): { [key: string]: any } {
    if (!this._casing) {
      const dreamApp = DreamApplication.getOrFail()
      this._casing = dreamApp.serializerCasing || 'camel'
    }

    return this.renderOne()
  }

  public renderOne() {
    let returnObj: { [key: string]: any } = {}
    for (const associationStatement of (this.constructor as typeof DreamSerializer).associationStatements) {
      if (associationStatement.flatten) {
        returnObj = {
          ...returnObj,
          ...this.applyAssociation(associationStatement),
        }
      } else {
        returnObj[this.applyCasingToField(associationStatement.field)] =
          this.applyAssociation(associationStatement)
      }
    }

    this.attributes.forEach(attr => {
      const attributeStatement = (this.constructor as typeof DreamSerializer).attributeStatements.find(
        s =>
          [attr, this.applyCasingToField(attr)].includes(s.field) ||
          [attr, this.applyCasingToField(attr)].includes(this.applyCasingToField(s.field))
      )

      if (attributeStatement) {
        const { field, renderAs, renderOptions } = attributeStatement
        const fieldWithCasing = this.applyCasingToField(field)

        let dateValue: CalendarDate | CalendarDate[] | DateTime | DateTime[] | null | undefined
        let decimalValue: number | number[] | string | string[] | null | undefined

        switch (renderAs) {
          case 'date':
          case 'date[]':
            dateValue = this.getAttributeValue(attributeStatement)
            returnObj[fieldWithCasing] = Array.isArray(dateValue)
              ? dateValue?.map(date => unknownTypeToIsoDateString(date))
              : unknownTypeToIsoDateString(dateValue)
            break

          case 'date-time':
          case 'date-time[]':
            dateValue = this.getAttributeValue(attributeStatement)
            returnObj[fieldWithCasing] = Array.isArray(dateValue)
              ? dateValue?.map(date => unknownTypeToIsoDatetimeString(date))
              : unknownTypeToIsoDatetimeString(dateValue)
            break

          case 'decimal':
          case 'decimal[]':
            decimalValue = this.getAttributeValue(attributeStatement)
            returnObj[fieldWithCasing] = Array.isArray(decimalValue)
              ? decimalValue?.map(date => unknownTypeToDecimal(date, renderOptions?.precision))
              : unknownTypeToDecimal(decimalValue, renderOptions?.precision)
            break

          case 'integer':
          case 'integer[]':
            decimalValue = this.getAttributeValue(attributeStatement)
            returnObj[fieldWithCasing] = Array.isArray(decimalValue)
              ? decimalValue?.map(date => unknownTypeToDecimal(date, 0))
              : unknownTypeToDecimal(decimalValue, 0)

            break

          default:
            returnObj[fieldWithCasing] = this.getAttributeValue(attributeStatement)
        }
      }
    })

    return returnObj
  }

  private applyAssociation(associationStatement: DreamSerializerAssociationStatement) {
    const associatedData = this.associatedData(associationStatement)

    if (associationStatement.type === 'RendersMany' && Array.isArray(associatedData))
      return associatedData.map(d => this.renderAssociation(d, associationStatement))
    else if (associatedData) return this.renderAssociation(associatedData, associationStatement)
    return associationStatement.type === 'RendersMany' ? [] : null
  }

  private renderAssociation(
    associatedData: SerializableDreamOrViewModel,
    associationStatement: DreamSerializerAssociationStatement
  ) {
    const SerializerClass = DreamSerializer.getAssociatedSerializerDuringRender(
      associatedData,
      associationStatement
    )
    if (!SerializerClass) throw new MissingSerializer(associatedData.constructor as typeof Dream)

    return new SerializerClass(associatedData).absorbPassthrough(this).render()
  }

  private associatedData(associationStatement: DreamSerializerAssociationStatement) {
    const delegateToPassthroughData = associationStatement.source === DreamConst.passthrough
    let self = (delegateToPassthroughData ? this.$passthroughData : this.$data) as any

    if (associationStatement.through) {
      const throughField = associationStatement.through

      if (Array.isArray(self)) {
        self = self.flatMap(singleField => singleField[throughField])
      } else {
        self = self[throughField]
      }

      if (self === undefined) {
        throw new FailedToRenderThroughAssociationForSerializer(this.constructor.name, throughField)
      }
    }

    if (Array.isArray(self)) {
      return self.flatMap(item => {
        let returnValue: any
        if (delegateToPassthroughData) returnValue = item[associationStatement.field]
        returnValue = item[associationStatement.source as string]

        return Array.isArray(returnValue) ? returnValue.flat() : returnValue
      })
    } else {
      if (delegateToPassthroughData) return self[associationStatement.field]
      return self[associationStatement.source as string]
    }
  }

  private getAttributeValue(attributeStatement: AttributeStatement) {
    const { field } = attributeStatement

    let pathToValue: any = this as any
    if (attributeStatement.renderOptions?.delegate) {
      const delegateField = attributeStatement.renderOptions?.delegate
      pathToValue = (this as any).$data?.[delegateField] || null
    }

    const valueOrCb = pathToValue[field]

    if (attributeStatement.functional) {
      return valueOrCb.call(this, this.$data)
    } else {
      return valueOrCb
    }
  }

  private applyCasingToField(field: string) {
    switch (this._casing) {
      case 'camel':
        return camelize(field)
      case 'snake':
        return snakeify(field)
      default:
        return field
    }
  }
}

function unknownTypeToIsoDateString(dateTime: unknown): string | null {
  if (dateTime instanceof CalendarDate || dateTime instanceof DateTime) return dateTime.toISODate()
  return null
}

function unknownTypeToIsoDatetimeString(dateTime: unknown): string | null {
  if (dateTime instanceof CalendarDate) return DateTime.fromISO(dateTime.toISO()!).toISO()
  if (dateTime instanceof DateTime) return dateTime.toISO()
  return null
}

function numberOrStringToNumber(num: string | number | undefined | null) {
  if (num === undefined) return null
  if (num === null) return null
  if (typeof num === 'number') return num
  return Number(num)
}

function unknownTypeToDecimal(
  decimalOrString: string | number | undefined | null,
  precision: RoundingPrecision | undefined
): number | null {
  const decimalValue = numberOrStringToNumber(decimalOrString)
  if (decimalValue === null) return null
  return precision === undefined ? decimalValue : round(decimalValue, precision)
}

export interface DreamSerializerStaticRenderOpts {
  passthrough?: any
}

export type SerializerPublicFields<I extends DreamSerializer> = keyof Omit<
  I,
  | 'render'
  | 'passthrough'
  | 'renderOne'
  | 'casing'
  | 'attributes'
  | 'data'
  | 'attributeTypeReflection'
  | 'isDreamSerializerInstance'
> &
  string
