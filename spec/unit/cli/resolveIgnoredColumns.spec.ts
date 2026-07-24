import Dream from '../../../src/Dream.js'
import CannotIgnoreAssociationColumn from '../../../src/errors/schema-builder/CannotIgnoreAssociationColumn.js'
import CannotIgnoreEncryptedColumn from '../../../src/errors/schema-builder/CannotIgnoreEncryptedColumn.js'
import CannotIgnorePrimaryKey from '../../../src/errors/schema-builder/CannotIgnorePrimaryKey.js'
import CannotIgnoreSoftDeleteColumn from '../../../src/errors/schema-builder/CannotIgnoreSoftDeleteColumn.js'
import CannotIgnoreSortablePositionColumn from '../../../src/errors/schema-builder/CannotIgnoreSortablePositionColumn.js'
import CannotIgnoreSortableScopeColumn from '../../../src/errors/schema-builder/CannotIgnoreSortableScopeColumn.js'
import CannotIgnoreStiTypeColumn from '../../../src/errors/schema-builder/CannotIgnoreStiTypeColumn.js'
import ConflictingIgnoredColumns from '../../../src/errors/schema-builder/ConflictingIgnoredColumns.js'
import IgnoredColumnMustBeCamelCase from '../../../src/errors/schema-builder/IgnoredColumnMustBeCamelCase.js'
import resolveIgnoredColumns from '../../../src/helpers/cli/resolveIgnoredColumns.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import Latex from '../../../test-app/app/models/Balloon/Latex.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'
import Collar from '../../../test-app/app/models/Collar.js'
import ModelWithIgnoredColumns from '../../../test-app/app/models/ModelWithIgnoredColumns.js'
import Pet from '../../../test-app/app/models/Pet.js'
import Post from '../../../test-app/app/models/Post.js'
import Rating from '../../../test-app/app/models/Rating.js'
import User from '../../../test-app/app/models/User.js'

describe('resolveIgnoredColumns', () => {
  const overriddenPrototypes: {
    prototype: object
    originalDescriptor: PropertyDescriptor | undefined
  }[] = []

  function overrideIgnoredColumns(modelClass: typeof Dream, ignoredColumns: string[]) {
    const prototype = modelClass.prototype
    overriddenPrototypes.push({
      prototype,
      originalDescriptor: Object.getOwnPropertyDescriptor(prototype, 'ignoredColumns'),
    })
    Object.defineProperty(prototype, 'ignoredColumns', {
      get: () => ignoredColumns,
      configurable: true,
    })
  }

  afterEach(() => {
    // put back the prototype's own descriptor when it had one (e.g.
    // ModelWithIgnoredColumns's real getter); otherwise remove ours so the
    // getter inherited from Dream shows through again. Restore in reverse
    // order so stacked overrides of the same prototype unwind correctly
    overriddenPrototypes.reverse().forEach(({ prototype, originalDescriptor }) => {
      if (originalDescriptor) Object.defineProperty(prototype, 'ignoredColumns', originalDescriptor)
      else delete (prototype as any).ignoredColumns
    })
    overriddenPrototypes.length = 0
  })

  it('returns the set of columns declared by the models backed by the table', () => {
    // User declares a HasMany association pointing at ModelWithIgnoredColumns,
    // and ModelWithIgnoredColumns declares a BelongsTo association pointing at
    // User; neither names deprecatedColumn, so the declaration resolves cleanly
    expect(
      resolveIgnoredColumns([ModelWithIgnoredColumns], 'model_with_ignored_columns', [
        ModelWithIgnoredColumns,
        User,
      ])
    ).toEqual(new Set(['deprecatedColumn']))
  })

  it('returns an empty set when no model declares ignored columns', () => {
    expect(resolveIgnoredColumns([Pet], 'pets', [Pet])).toEqual(new Set())
  })

  context('a model declares an ignored column that is not camelCase', () => {
    it('throws IgnoredColumnMustBeCamelCase', () => {
      overrideIgnoredColumns(Pet, ['deprecated_column'])
      expect(() => resolveIgnoredColumns([Pet], 'pets', [Pet])).toThrow(IgnoredColumnMustBeCamelCase)
    })
  })

  context('a model attempts to ignore its primary key', () => {
    it('throws CannotIgnorePrimaryKey', () => {
      overrideIgnoredColumns(Pet, ['id'])
      expect(() => resolveIgnoredColumns([Pet], 'pets', [Pet])).toThrow(CannotIgnorePrimaryKey)
    })
  })

  context('an STI model attempts to ignore the type column', () => {
    it('throws CannotIgnoreStiTypeColumn when declared on the STI base', () => {
      overrideIgnoredColumns(Balloon, ['type'])
      expect(() =>
        resolveIgnoredColumns([Balloon, Latex, Mylar], 'beautiful_balloons', [Balloon, Latex, Mylar])
      ).toThrow(CannotIgnoreStiTypeColumn)
    })

    it('throws CannotIgnoreStiTypeColumn when declared on an STI child', () => {
      overrideIgnoredColumns(Latex, ['type'])
      expect(() =>
        resolveIgnoredColumns([Balloon, Latex, Mylar], 'beautiful_balloons', [Balloon, Latex, Mylar])
      ).toThrow(CannotIgnoreStiTypeColumn)
    })
  })

  context('a non-STI model ignores a column named type', () => {
    it('does not throw', () => {
      overrideIgnoredColumns(Pet, ['type'])
      expect(resolveIgnoredColumns([Pet], 'pets', [Pet])).toEqual(new Set(['type']))
    })
  })

  context('a model attempts to ignore the foreign key of its own BelongsTo association', () => {
    it('throws CannotIgnoreAssociationColumn', () => {
      overrideIgnoredColumns(ModelWithIgnoredColumns, ['userId'])
      expect(() =>
        resolveIgnoredColumns([ModelWithIgnoredColumns], 'model_with_ignored_columns', [
          ModelWithIgnoredColumns,
        ])
      ).toThrow(CannotIgnoreAssociationColumn)
    })
  })

  context('a HasMany association on another model names a foreign key on the table', () => {
    it('throws CannotIgnoreAssociationColumn', () => {
      // User declares `@deco.HasMany('ModelWithIgnoredColumns')`, which names
      // the userId foreign key on the model_with_ignored_columns table
      overrideIgnoredColumns(ModelWithIgnoredColumns, ['userId'])
      expect(() =>
        resolveIgnoredColumns([ModelWithIgnoredColumns], 'model_with_ignored_columns', [User])
      ).toThrow(CannotIgnoreAssociationColumn)
    })
  })

  context('a model attempts to ignore the polymorphic type field of its own BelongsTo association', () => {
    it('throws CannotIgnoreAssociationColumn', () => {
      overrideIgnoredColumns(Rating, ['rateableType'])
      expect(() => resolveIgnoredColumns([Rating], 'ratings', [Rating])).toThrow(
        CannotIgnoreAssociationColumn
      )
    })
  })

  context('a polymorphic HasMany association on another model names the type field on the table', () => {
    it('throws CannotIgnoreAssociationColumn', () => {
      // Post declares `@deco.HasMany('Rating', { on: 'rateableId', polymorphic: true })`,
      // which names the rateableType type field on the ratings table
      overrideIgnoredColumns(Rating, ['rateableType'])
      expect(() => resolveIgnoredColumns([Rating], 'ratings', [Post])).toThrow(CannotIgnoreAssociationColumn)
    })
  })

  context('an association names an ignored column as its primaryKeyOverride', () => {
    it('throws CannotIgnoreAssociationColumn for a BelongsTo on another model pointing at the table', () => {
      // Pet declares `@deco.BelongsTo('User', { primaryKeyOverride: 'uuid', on: 'userUuid' })`;
      // for a BelongsTo, the primaryKeyOverride column lives on the
      // associated model's table (users)
      overrideIgnoredColumns(User, ['uuid'])
      expect(() => resolveIgnoredColumns([User], 'users', [Pet])).toThrow(CannotIgnoreAssociationColumn)
    })

    it('throws CannotIgnoreAssociationColumn for a HasMany on a model backed by the table', () => {
      // User declares `@deco.HasMany('Pet', { on: 'userUuid', primaryKeyOverride: 'uuid' })`;
      // for a HasMany/HasOne, the primaryKeyOverride column lives on the
      // declaring model's own table (users)
      overrideIgnoredColumns(User, ['uuid'])
      expect(() => resolveIgnoredColumns([User], 'users', [User])).toThrow(CannotIgnoreAssociationColumn)
    })
  })

  context('a model attempts to ignore an @Sortable position field', () => {
    it('throws CannotIgnoreSortablePositionColumn', () => {
      overrideIgnoredColumns(Pet, ['positionWithinSpecies'])
      expect(() => resolveIgnoredColumns([Pet], 'pets', [Pet])).toThrow(CannotIgnoreSortablePositionColumn)
    })
  })

  context('a model attempts to ignore a plain-column @Sortable scope', () => {
    it('throws CannotIgnoreSortableScopeColumn', () => {
      // Pet declares `@deco.Sortable({ scope: 'species' })`, and species is a
      // plain column on the pets table, not an association
      overrideIgnoredColumns(Pet, ['species'])
      expect(() => resolveIgnoredColumns([Pet], 'pets', [Pet])).toThrow(CannotIgnoreSortableScopeColumn)
    })

    it('throws CannotIgnoreSortableScopeColumn when the column appears within an array scope', () => {
      // Collar declares `@deco.Sortable({ scope: ['pet', 'tagName'] })`; pet
      // names a BelongsTo association, but tagName is a plain column
      overrideIgnoredColumns(Collar, ['tagName'])
      expect(() => resolveIgnoredColumns([Collar], 'collars', [Collar])).toThrow(
        CannotIgnoreSortableScopeColumn
      )
    })
  })

  context('an @Sortable scope names a BelongsTo association rather than a column', () => {
    it('does not treat an ignored column matching the association name as a scope column', () => {
      // Collar's @Sortable scopes name the pet and balloon BelongsTo
      // associations, which the sortable machinery resolves to their foreign
      // keys (petId/balloonId) rather than to columns named pet/balloon
      overrideIgnoredColumns(Collar, ['balloon'])
      expect(resolveIgnoredColumns([Collar], 'collars', [Collar])).toEqual(new Set(['balloon']))
    })

    it('resolves cleanly when an unrelated column is ignored', () => {
      overrideIgnoredColumns(Collar, ['hidden'])
      expect(resolveIgnoredColumns([Collar], 'collars', [Collar])).toEqual(new Set(['hidden']))
    })
  })

  context('a model attempts to ignore the backing column of an @Encrypted property', () => {
    it('throws CannotIgnoreEncryptedColumn', () => {
      overrideIgnoredColumns(User, ['encryptedSecret'])
      expect(() => resolveIgnoredColumns([User], 'users', [User])).toThrow(CannotIgnoreEncryptedColumn)
    })
  })

  context('a SoftDelete model attempts to ignore its deletedAtField', () => {
    it('throws CannotIgnoreSoftDeleteColumn', () => {
      overrideIgnoredColumns(Pet, ['deletedAt'])
      expect(() => resolveIgnoredColumns([Pet], 'pets', [Pet])).toThrow(CannotIgnoreSoftDeleteColumn)
    })
  })

  context('models sharing a table declare different ignored columns', () => {
    it('throws ConflictingIgnoredColumns', () => {
      overrideIgnoredColumns(Latex, ['color'])
      expect(() =>
        resolveIgnoredColumns([Balloon, Latex, Mylar], 'beautiful_balloons', [Balloon, Latex, Mylar])
      ).toThrow(ConflictingIgnoredColumns)
    })
  })

  context('models sharing a table agree on their ignored columns', () => {
    it('returns the agreed set', () => {
      // declaring on the STI base is inherited by the children, so all
      // models backed by the table agree automatically
      overrideIgnoredColumns(Balloon, ['color'])
      expect(
        resolveIgnoredColumns([Balloon, Latex, Mylar], 'beautiful_balloons', [Balloon, Latex, Mylar])
      ).toEqual(new Set(['color']))
    })
  })
})
