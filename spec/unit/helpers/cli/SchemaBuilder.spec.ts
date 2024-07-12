// NOTE: since schema builder is responsible for writing db/schema.ts,
// we can simply examine the schema.ts file to ensure that it is properly
// written

import User from '../../../../test-app/app/models/User'
import { BalloonColorsEnumValues } from '../../../../test-app/db/sync'

describe('SchemaBuilder', () => {
  describe('#build', () => {
    context('columns', () => {
      context('bigint', () => {
        it('renders "bigint" for dbType', () => {
          expect(User.prototype.dreamconf.schema.collars.columns.balloonId.dbType).toEqual('bigint')
        })
      })

      context('boolean', () => {
        it('renders "boolean" for dbType', () => {
          expect(User.prototype.dreamconf.schema.collars.columns.lost.dbType).toEqual('boolean')
        })
      })

      context('varchar', () => {
        it('renders "character varying" for dbType', () => {
          expect(User.prototype.dreamconf.schema.collars.columns.tagName.dbType).toEqual('character varying')
        })
      })

      context('integer', () => {
        it('renders "integer" for dbType', () => {
          expect(User.prototype.dreamconf.schema.collars.columns.position.dbType).toEqual('integer')
        })
      })

      context('citext', () => {
        it('renders "citext" for dbType', () => {
          expect(User.prototype.dreamconf.schema.users.columns.favoriteWord.dbType).toEqual('citext')
        })
      })

      context('primitive (in this case, integer) array type', () => {
        it('renders "integer[]" for integer[] dbType', () => {
          expect(User.prototype.dreamconf.schema.users.columns.favoriteNumbers.dbType).toEqual('integer[]')
          expect(User.prototype.dreamconf.schema.users.columns.favoriteNumbers.enumValues).toBeNull()
        })

        it('renders "timestamp[]" for timestamp[] dbType', () => {
          expect(User.prototype.dreamconf.schema.users.columns.favoriteDatetimes.dbType).toEqual(
            'timestamp without time zone[]'
          )
          expect(User.prototype.dreamconf.schema.users.columns.favoriteDatetimes.enumValues).toBeNull()
        })
      })

      context('enum', () => {
        it('renders the enum name for dbType', () => {
          expect(User.prototype.dreamconf.schema.beautiful_balloons.columns.color.dbType).toEqual(
            'balloon_colors_enum'
          )
        })

        it('sets enum-specific fields', () => {
          expect(User.prototype.dreamconf.schema.beautiful_balloons.columns.color.enumValues).toEqual(
            BalloonColorsEnumValues
          )
        })

        context('enum array', () => {
          it('renders the enum name[] for dbType', () => {
            expect(User.prototype.dreamconf.schema.beautiful_balloons.columns.multicolor.dbType).toEqual(
              'balloon_colors_enum[]'
            )
          })

          it('sets enum-specific fields', () => {
            expect(User.prototype.dreamconf.schema.beautiful_balloons.columns.multicolor.enumValues).toEqual(
              BalloonColorsEnumValues
            )
            expect(User.prototype.dreamconf.schema.beautiful_balloons.columns.multicolor.isArray).toEqual(
              true
            )
          })
        })
      })

      context('for a column that allows null', () => {
        it('sets allowNull to true', () => {
          expect(User.prototype.dreamconf.schema.collars.columns.balloonId.allowNull).toEqual(true)
        })
      })
    })

    context('primaryKey', () => {
      it('sets the primaryKey', () => {
        expect(User.prototype.dreamconf.schema.users.primaryKey).toEqual('id')
      })
    })

    context('createdAtField', () => {
      it('sets the createdAtField', () => {
        expect(User.prototype.dreamconf.schema.users.createdAtField).toEqual('createdAt')
        // createdAt intentionally points to updatedAt on this model
        expect(User.prototype.dreamconf.schema.model_without_custom_deleted_ats.createdAtField).toEqual(
          'updatedAt'
        )
      })
    })

    context('scopes', () => {
      it('sets the default and non-default scopes', () => {
        expect(User.prototype.dreamconf.schema.model_without_deleted_ats.scopes.default).toEqual([
          'dream:SoftDelete',
          'howyadoin',
        ])
        expect(User.prototype.dreamconf.schema.beautiful_balloons.scopes.default).toEqual([
          'dream:STI',
          'dream:SoftDelete',
        ])
        expect(User.prototype.dreamconf.schema.users.scopes.named).toEqual(['withFunnyName'])
      })
    })

    context('updatedAtField', () => {
      it('sets the updatedAtField', () => {
        expect(User.prototype.dreamconf.schema.users.updatedAtField).toEqual('updatedAt')
        // updatedAt intentionally points to createdAt on this model
        expect(User.prototype.dreamconf.schema.model_without_custom_deleted_ats.updatedAtField).toEqual(
          'createdAt'
        )
      })
    })

    context('deletedAtField', () => {
      it('sets the deletedAtField', () => {
        expect(User.prototype.dreamconf.schema.users.deletedAtField).toEqual('deletedAt')
        // deleteAt intentionally points to id on this model
        expect(User.prototype.dreamconf.schema.model_without_custom_deleted_ats.deletedAtField).toEqual('id')
      })
    })

    context('associations', () => {
      it('renders correct association data', () => {
        expect(User.prototype.dreamconf.schema.collars.associations.pet).toEqual({
          type: 'BelongsTo',
          tables: ['pets'],
          optional: false,
          foreignKey: 'petId',
          requiredWhereClauses: null,
        })
      })

      it('renders required where clauses', () => {
        expect(
          User.prototype.dreamconf.schema.compositions.associations.inlineWhereCurrentLocalizedText
        ).toEqual({
          type: 'HasOne',
          foreignKey: 'localizableId',
          tables: ['localized_texts'],
          optional: null,
          requiredWhereClauses: ['locale'],
        })
      })
    })
  })
})
