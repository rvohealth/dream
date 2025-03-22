import { modelCBtoSingleDreamClass } from '../../decorators/field/association/shared.js'
import Dream from '../../Dream.js'
import { PartialAssociationStatement } from '../../types/associations/shared.js'

export class InvalidComputedForeignKey extends Error {
  public dreamClass: typeof Dream
  public partialAssociation: PartialAssociationStatement
  public computedForeignKey: string
  public table: string

  constructor(
    dreamClass: typeof Dream,
    partialAssociation: PartialAssociationStatement,
    computedForeignKey: string,
    table: string
  ) {
    super()
    this.dreamClass = dreamClass
    this.partialAssociation = partialAssociation
    this.computedForeignKey = computedForeignKey
    this.table = table
  }

  public get message() {
    return `
Add an explicit foreignKey declaration to this association declaration:
  Dream class: ${this.dreamClass.sanitizedName}
  Association: ${this.partialAssociation.as}
Dream tried ${this.computedForeignKey} automatically, but it isn't a column in table ${this.table}.
    `
  }
}

export class ExplicitForeignKeyRequired extends Error {
  public dreamClass: typeof Dream
  public partialAssociation: PartialAssociationStatement
  public explicitForeignKey: string
  public table: string

  constructor(
    dreamClass: typeof Dream,
    partialAssociation: PartialAssociationStatement,
    explicitForeignKey: string,
    table: string
  ) {
    super()
    this.dreamClass = dreamClass
    this.partialAssociation = partialAssociation
    this.explicitForeignKey = explicitForeignKey
    this.table = table
  }

  public get message() {
    return `
${this.explicitForeignKey} is not a valid column on table ${this.table}.
Fix the foreignKey declaration on:
  Dream class: ${this.dreamClass.sanitizedName}
  Association: ${this.partialAssociation.as}
    `
  }
}

export function checkForeignKey(
  explicitForeignKey: string | undefined,
  computedForeignKey: string,
  dreamClass: typeof Dream,
  partialAssociation: PartialAssociationStatement
) {
  let table
  if (partialAssociation.type === 'BelongsTo') table = dreamClass.table
  else table = modelCBtoSingleDreamClass(dreamClass, partialAssociation).table
  const tableColumns = Object.keys(dreamClass.prototype.schema[table]?.columns)

  const validForeignKey = tableColumns.includes(computedForeignKey)
  if (validForeignKey) return

  if (explicitForeignKey)
    throw new ExplicitForeignKeyRequired(dreamClass, partialAssociation, explicitForeignKey, table)
  else throw new InvalidComputedForeignKey(dreamClass, partialAssociation, computedForeignKey, table)
}
