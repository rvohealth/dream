import Dream from '../dream'
import camelize from '../../shared/helpers/camelize'
import snakeify from '../../shared/helpers/snakeify'
import { DateTime } from 'luxon'
import { AttributeStatement } from './decorators/attribute'
import { AssociationStatement } from './decorators/associations/shared'
import { DelegateStatement } from './decorators/delegate'
import { loadDreamYamlFile } from '../helpers/path'
import MissingSerializer from '../exceptions/missing-serializer'

export default class DreamSerializer<DataType = any, PassthroughDataType = any> {
  public static attributeStatements: AttributeStatement[] = []
  public static associationStatements: AssociationStatement[] = []
  public static delegateStatements: DelegateStatement[] = []
  private _data: DataType
  private _casing: 'snake' | 'camel' | null = null
  constructor(data: DataType) {
    this._data = data

    const attributeStatements = [...(this.constructor as typeof DreamSerializer).attributeStatements]

    attributeStatements.forEach(attributeStatement => {
      if (!attributeStatement.functional) {
        Object.defineProperty(this, attributeStatement.field, {
          get() {
            return this.data[attributeStatement.field]
          },

          set(val: any) {
            this.data[attributeStatement.field] = val
          },
        })
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
  public passthrough(obj: Partial<PassthroughDataType>) {
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
    this.attributes.forEach(attr => {
      const attributeStatement = (this.constructor as typeof DreamSerializer).attributeStatements.find(
        s =>
          [attr, this.applyCasingToField(attr)].includes(s.field) ||
          [attr, this.applyCasingToField(attr)].includes(this.applyCasingToField(s.field))
      )

      if (attributeStatement) {
        const { field, renderAs } = attributeStatement
        const fieldWithCasing = this.applyCasingToField(field)
        switch (renderAs) {
          case 'date':
            const fieldValue: DateTime | undefined = this.getAttributeValue(attributeStatement)
            returnObj[fieldWithCasing] = fieldValue?.toFormat('yyyy-MM-dd') || null
            break

          default:
            returnObj[fieldWithCasing] = this.getAttributeValue(attributeStatement)
        }
      }
    })
    ;(this.constructor as typeof DreamSerializer).delegateStatements.forEach(delegateStatement => {
      returnObj[this.applyCasingToField(delegateStatement.field)] = this.applyDelegation(delegateStatement)
    })

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
    return returnObj
  }

  private applyAssociation(associationStatement: AssociationStatement) {
    const associatedData = this.associatedData(associationStatement)

    if (associationStatement.type === 'RendersMany' && associatedData?.constructor === Array)
      return associatedData.map(d => this.renderAssociation(d, associationStatement))
    else if (associatedData) return this.renderAssociation(associatedData, associationStatement)
    return associationStatement.type === 'RendersMany' ? [] : null
  }

  private renderAssociation(associatedData: any, associationStatement: AssociationStatement) {
    const serializerClass = associationStatement.serializerClassCB
      ? associationStatement.serializerClassCB()
      : (associatedData as Dream)?.serializer

    if (!serializerClass) throw new MissingSerializer(associatedData.constructor)
    return new serializerClass(associatedData).passthrough(this.passthroughData).render()
  }

  private associatedData(associationStatement: AssociationStatement) {
    const delegateToPassthroughData = associationStatement.source === 'passthroughData'
    let self = (delegateToPassthroughData ? this.passthroughData : this.data) as any

    if (associationStatement.through) {
      associationStatement.through.split('.').forEach(throughField => {
        self = self[throughField]
      })
    }

    if (delegateToPassthroughData) return self[associationStatement.field]
    return self[associationStatement.source]
  }

  private applyDelegation(delegateStatement: DelegateStatement) {
    return (this.data as any)[delegateStatement.delegateTo][delegateStatement.field]
  }

  private getAttributeValue(attributeStatement: AttributeStatement) {
    const { field } = attributeStatement

    if (attributeStatement.functional) {
      return (this as any)[field](this.data)
    } else {
      return (this.data as any)[field]
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
