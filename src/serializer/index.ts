import Dream from '../dream'
import { DreamConst } from '../dream/types'
import camelize from '../helpers/camelize'
import snakeify from '../helpers/snakeify'
import { DateTime } from 'luxon'
import { AttributeStatement } from './decorators/attribute'
import { AssociationStatement } from './decorators/associations/shared'
import MissingSerializer from '../exceptions/missing-serializer'
import round from '../helpers/round'
import NonLoadedAssociation from '../exceptions/associations/non-loaded-association'
import isArray from 'lodash.isarray'
import FailedToRenderThroughAssociationForSerializer from '../exceptions/serializers/failed-to-render-through-association'

export default class DreamSerializer<DataType = any, PassthroughDataType = any> {
  public static attributeStatements: AttributeStatement[] = []
  public static associationStatements: AssociationStatement[] = []
  public static readonly isDreamSerializer = true

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

  protected passthroughData: Partial<PassthroughDataType> = {}
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
        const { field, renderAs, options } = attributeStatement
        const fieldWithCasing = this.applyCasingToField(field)

        let dateValue: DateTime | null | undefined
        let roundValue: number | null | undefined

        switch (renderAs) {
          case 'date':
            dateValue = this.getAttributeValue(attributeStatement)
            returnObj[fieldWithCasing] = dateValue?.toFormat('yyyy-MM-dd') || null
            break

          case 'decimal':
            roundValue = this.getAttributeValue(attributeStatement)

            returnObj[fieldWithCasing] =
              typeof roundValue === 'number' ? round(roundValue, options?.precision) : null
            break

          default:
            returnObj[fieldWithCasing] = this.getAttributeValue(attributeStatement)
        }
      }
    })

    return returnObj
  }

  private applyAssociation(associationStatement: AssociationStatement) {
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

  private renderAssociation(associatedData: any, associationStatement: AssociationStatement) {
    const serializerClass = associationStatement.serializerClassCB
      ? associationStatement.serializerClassCB()
      : (associatedData as Dream)?.serializer

    if (!serializerClass) throw new MissingSerializer(associatedData.constructor as typeof Dream)
    return new serializerClass(associatedData).passthrough(this.passthroughData).render()
  }

  private associatedData(associationStatement: AssociationStatement) {
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
    if (attributeStatement.options?.delegate) {
      const delegateField = attributeStatement.options?.delegate
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
