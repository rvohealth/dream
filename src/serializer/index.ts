import isArray from 'lodash.isarray'
import { DateTime } from 'luxon'
import Dream from '../dream'
import {
  DreamConst,
  SerializableClass,
  SerializableDreamClassOrViewModelClass,
  SerializableDreamOrViewModel,
} from '../dream/types'
import NonLoadedAssociation from '../exceptions/associations/non-loaded-association'
import GlobalNameNotSet from '../exceptions/dream-application/global-name-not-set'
import MissingSerializer from '../exceptions/missing-serializers-definition'
import FailedToRenderThroughAssociationForSerializer from '../exceptions/serializers/failed-to-render-through-association'
import CalendarDate from '../helpers/CalendarDate'
import camelize from '../helpers/camelize'
import compact from '../helpers/compact'
import inferSerializerFromDreamOrViewModel, {
  inferSerializerFromDreamClassOrViewModelClass,
} from '../helpers/inferSerializerFromDreamOrViewModel'
import round from '../helpers/round'
import snakeify from '../helpers/snakeify'
import { DreamSerializerAssociationStatement } from './decorators/associations/shared'
import { AttributeStatement, SerializableTypes } from './decorators/attribute'

export default class DreamSerializer<DataType = any, PassthroughDataType = any> {
  public static attributeStatements: AttributeStatement[] = []
  public static associationStatements: DreamSerializerAssociationStatement[] = []
  public static readonly isDreamSerializer = true

  private static _globalName: string

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
    const serializer = this.associationDeclaredSerializer(associationStatement)
    if (serializer) return [serializer]

    let classOrClasses = associationStatement.dreamOrSerializerClass as SerializableClass[]
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
    const dreamSerializerOrNull = this.associationDeclaredSerializer(associationStatement)

    if (dreamSerializerOrNull) return dreamSerializerOrNull
    return inferSerializerFromDreamOrViewModel(associatedData, associationStatement.serializerKey)
  }

  private static associationDeclaredSerializer(
    associationStatement: DreamSerializerAssociationStatement
  ): typeof DreamSerializer<any, any> | null {
    if ((associationStatement.dreamOrSerializerClass as typeof DreamSerializer)?.isDreamSerializer) {
      return associationStatement.dreamOrSerializerClass as typeof DreamSerializer
    }
    return null
  }

  private _data: DataType
  private _casing: 'snake' | 'camel' | null = null
  public readonly isDreamSerializerInstance = true

  constructor(data: DataType) {
    this._data = data

    const attributeStatements = [...(this.constructor as typeof DreamSerializer).attributeStatements]

    attributeStatements.forEach(attributeStatement => {
      if (!attributeStatement.functional) {
        if (!Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), attributeStatement.field)?.get) {
          Object.defineProperty(Object.getPrototypeOf(this), attributeStatement.field, {
            get() {
              return this.data[attributeStatement.field]
            },

            set(val: any) {
              this.data[attributeStatement.field] = val
            },
          })
        }
      }
    })
  }

  public get data() {
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

  protected passthroughData: PassthroughDataType = {} as any
  public passthrough(obj: PassthroughDataType) {
    this.passthroughData = {
      ...this.passthroughData,
      ...obj,
    }
    return this
  }

  public render(): { [key: string]: any } {
    if (!this._casing) {
      this._casing = (process.env['SERIALIZER_CASING'] as 'camel' | 'snake') || 'camel'
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

        let dateValue: CalendarDate | DateTime | null | undefined
        let decimalValue: number | null | undefined

        switch (this.computedRenderAs(renderAs)) {
          case 'date':
            dateValue = this.getAttributeValue(attributeStatement)
            returnObj[fieldWithCasing] = dateValue?.toISODate() || null
            break

          case 'date-time':
            dateValue = this.getAttributeValue(attributeStatement)
            returnObj[fieldWithCasing] = dateValue?.toISO()
              ? DateTime.fromISO(dateValue.toISO()!).toISO()
              : null
            break

          case 'decimal':
            decimalValue = this.numberOrStringToNumber(this.getAttributeValue(attributeStatement))

            returnObj[fieldWithCasing] =
              decimalValue === null
                ? null
                : renderOptions?.precision === undefined
                  ? decimalValue
                  : round(decimalValue, renderOptions?.precision)
            break

          case 'integer':
            decimalValue = this.numberOrStringToNumber(this.getAttributeValue(attributeStatement))
            returnObj[fieldWithCasing] = decimalValue === null ? null : round(decimalValue)
            break

          default:
            returnObj[fieldWithCasing] = this.getAttributeValue(attributeStatement)
        }
      }
    })

    return returnObj
  }

  private numberOrStringToNumber(num: string | number | undefined | null) {
    if (num === undefined) return null
    if (num === null) return null
    if (typeof num === 'number') return num
    return Number(num)
  }

  private computedRenderAs(renderAs: SerializableTypes | undefined) {
    if (typeof renderAs === 'object') {
      const safeRenderAs = renderAs as any

      if (safeRenderAs.type === 'string' || safeRenderAs.type === 'number') {
        if (safeRenderAs.format) return safeRenderAs.format
        return safeRenderAs.type
      }

      if (safeRenderAs.type) return safeRenderAs.type
    }

    return renderAs
  }

  private applyAssociation(associationStatement: DreamSerializerAssociationStatement) {
    // let associatedData: ReturnType<DreamSerializer.prototype.associatedData>
    let associatedData: any

    try {
      associatedData = this.associatedData(associationStatement)
    } catch (error) {
      if ((error as any).constructor !== NonLoadedAssociation) throw error
      if (associationStatement.optional) return undefined
      throw error
    }

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

    return new SerializerClass(associatedData).passthrough(this.passthroughData).render()
  }

  private associatedData(associationStatement: DreamSerializerAssociationStatement) {
    const delegateToPassthroughData = associationStatement.source === DreamConst.passthrough
    let self = (delegateToPassthroughData ? this.passthroughData : this.data) as any

    if (associationStatement.through) {
      const throughField = associationStatement.through

      if (isArray(self)) {
        self = self.flatMap(singleField => singleField[throughField])
      } else {
        self = self[throughField]
      }

      if (self === undefined) {
        throw new FailedToRenderThroughAssociationForSerializer(this.constructor.name, throughField)
      }
    }

    if (isArray(self)) {
      return self.flatMap(item => {
        let returnValue: any
        if (delegateToPassthroughData) returnValue = item[associationStatement.field]
        returnValue = item[associationStatement.source as string]

        return isArray(returnValue) ? returnValue.flat() : returnValue
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
      pathToValue = (this as any).data?.[delegateField] || null
    }

    const valueOrCb = pathToValue[field]

    if (attributeStatement.functional) {
      return valueOrCb.call(this, this.data)
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
