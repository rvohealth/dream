import Dream from '../dream'
import camelize from '../helpers/camelize'
import snakeify from '../helpers/snakeify'
import { DateTime } from 'luxon'
import { AttributeStatement } from './decorators/attribute'
import { AssociationStatement } from './decorators/associations/shared'
import { DelegateStatement } from './decorators/delegate'
import { loadDreamYamlFile } from '../helpers/path'

export default class DreamSerializer {
  public static attributeStatements: AttributeStatement[] = []
  public static associationStatements: AssociationStatement[] = []
  public static delegateStatements: DelegateStatement[] = []
  private _data: { [key: string]: any } | Dream | ({ [key: string]: any } | Dream)[]
  private _casing: 'snake' | 'camel' | null = null
  constructor(data: any) {
    this._data = data

    const attributeStatements = [...(this.constructor as typeof DreamSerializer).attributeStatements]

    attributeStatements.forEach(attributeStatement => {
      if (!attributeStatement.functional) {
        Object.defineProperty(this, attributeStatement.field, {
          get() {
            return this._data[attributeStatement.field]
          },

          set(val: any) {
            this._data[attributeStatement.field] = val
          },
        })
      }
    })
  }

  public get data() {
    if (Array.isArray(this._data)) return [...this._data]
    return { ...this._data }
  }

  public get originalData() {
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

  protected passthroughData: { [key: string]: any } = {}
  public passthrough(obj: { [key: string]: any }) {
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

    if (Array.isArray(this.data)) return this.renderMany()
    else return this.renderOne()
  }

  public renderMany(): { [key: string]: any }[] {
    const results: any[] = []
    for (const d of this.data as any[]) {
      results.push(new (this.constructor as typeof DreamSerializer)(d).render())
    }
    return results
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
    const serializerClass = associationStatement.serializerClassCB()
    const associatedData = this.associatedData(associationStatement)

    if (associatedData) return new serializerClass(associatedData).passthrough(this.passthroughData).render()
    else {
      if (associationStatement.type === 'RendersMany') return []
      return null
    }
  }

  private associatedData(associationStatement: AssociationStatement) {
    let self = this._data as any
    if (associationStatement.through) {
      associationStatement.through.split('.').forEach(throughField => {
        self = self[throughField]
      })
    }
    return self[associationStatement.source]
  }

  private applyDelegation(delegateStatement: DelegateStatement) {
    return (this._data as any)[delegateStatement.delegateTo][delegateStatement.field]
  }

  private getAttributeValue(attributeStatement: AttributeStatement) {
    const { field } = attributeStatement

    if (attributeStatement.functional) {
      return (this as any)[field](this._data)
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
