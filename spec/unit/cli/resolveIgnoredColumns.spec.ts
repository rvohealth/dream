import Dream from '../../../src/Dream.js'
import CannotIgnorePrimaryKey from '../../../src/errors/schema-builder/CannotIgnorePrimaryKey.js'
import CannotIgnoreStiTypeColumn from '../../../src/errors/schema-builder/CannotIgnoreStiTypeColumn.js'
import ConflictingIgnoredColumns from '../../../src/errors/schema-builder/ConflictingIgnoredColumns.js'
import resolveIgnoredColumns from '../../../src/helpers/cli/resolveIgnoredColumns.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import Latex from '../../../test-app/app/models/Balloon/Latex.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'
import ModelWithIgnoredColumns from '../../../test-app/app/models/ModelWithIgnoredColumns.js'
import Pet from '../../../test-app/app/models/Pet.js'

describe('resolveIgnoredColumns', () => {
  const overriddenPrototypes: object[] = []

  function overrideIgnoredColumns(modelClass: typeof Dream, ignoredColumns: string[]) {
    Object.defineProperty(modelClass.prototype, 'ignoredColumns', {
      get: () => ignoredColumns,
      configurable: true,
    })
    overriddenPrototypes.push(modelClass.prototype)
  }

  afterEach(() => {
    // remove the own descriptor so the getter inherited from Dream shows
    // through again
    overriddenPrototypes.forEach(prototype => {
      delete (prototype as any).ignoredColumns
    })
    overriddenPrototypes.length = 0
  })

  it('returns the set of columns declared by the models backed by the table', () => {
    expect(resolveIgnoredColumns([ModelWithIgnoredColumns], 'model_with_ignored_columns')).toEqual(
      new Set(['deprecatedColumn'])
    )
  })

  it('returns an empty set when no model declares ignored columns', () => {
    expect(resolveIgnoredColumns([Pet], 'pets')).toEqual(new Set())
  })

  context('a model attempts to ignore its primary key', () => {
    it('throws CannotIgnorePrimaryKey', () => {
      overrideIgnoredColumns(Pet, ['id'])
      expect(() => resolveIgnoredColumns([Pet], 'pets')).toThrow(CannotIgnorePrimaryKey)
    })
  })

  context('an STI model attempts to ignore the type column', () => {
    it('throws CannotIgnoreStiTypeColumn when declared on the STI base', () => {
      overrideIgnoredColumns(Balloon, ['type'])
      expect(() => resolveIgnoredColumns([Balloon, Latex, Mylar], 'beautiful_balloons')).toThrow(
        CannotIgnoreStiTypeColumn
      )
    })

    it('throws CannotIgnoreStiTypeColumn when declared on an STI child', () => {
      overrideIgnoredColumns(Latex, ['type'])
      expect(() => resolveIgnoredColumns([Balloon, Latex, Mylar], 'beautiful_balloons')).toThrow(
        CannotIgnoreStiTypeColumn
      )
    })
  })

  context('a non-STI model ignores a column named type', () => {
    it('does not throw', () => {
      overrideIgnoredColumns(Pet, ['type'])
      expect(resolveIgnoredColumns([Pet], 'pets')).toEqual(new Set(['type']))
    })
  })

  context('models sharing a table declare different ignored columns', () => {
    it('throws ConflictingIgnoredColumns', () => {
      overrideIgnoredColumns(Latex, ['color'])
      expect(() => resolveIgnoredColumns([Balloon, Latex, Mylar], 'beautiful_balloons')).toThrow(
        ConflictingIgnoredColumns
      )
    })
  })

  context('models sharing a table agree on their ignored columns', () => {
    it('returns the agreed set', () => {
      // declaring on the STI base is inherited by the children, so all
      // models backed by the table agree automatically
      overrideIgnoredColumns(Balloon, ['color'])
      expect(resolveIgnoredColumns([Balloon, Latex, Mylar], 'beautiful_balloons')).toEqual(new Set(['color']))
    })
  })
})
