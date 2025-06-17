// NOTE: since schema builder is responsible for writing types/dream.ts,
// we can simply examine the types/dream.ts file to ensure that it is properly
// written

import User from '../../../../test-app/app/models/User.js'
import { BalloonColorsEnumValues } from '../../../../test-app/types/db.js'

describe('SchemaBuilder', () => {
  describe('#build', () => {
    context('global schema', () => {
      context('globalNames', () => {
        it('renders models key value pairs', () => {
          expect(User.prototype.globalSchema.globalNames.models).toEqual(
            expect.objectContaining({ 'Graph/Edge': 'graph_edges', User: 'users' })
          )
        })

        it('renders serializers array', () => {
          expect(User.prototype.globalSchema.globalNames.serializers).toEqual(
            expect.arrayContaining(['UserSerializer', 'LocalizedText/BaseSerializer'])
          )
        })
      })
    })

    context('virtual columns', () => {
      it('renders virtualColumns', () => {
        expect(User.prototype.schema.users.virtualColumns).toEqual([
          'kilograms',
          'lbs',
          'otherSecret',
          'password',
          'randoVirtual',
          'secret',
        ])
      })
    })

    context('columns', () => {
      context('bigint', () => {
        it('renders "bigint" for dbType', () => {
          expect(User.prototype.schema.collars.columns.balloonId.dbType).toEqual('bigint')
        })
      })

      context('boolean', () => {
        it('renders "boolean" for dbType', () => {
          expect(User.prototype.schema.collars.columns.lost.dbType).toEqual('boolean')
        })
      })

      context('varchar', () => {
        it('renders "character varying" for dbType', () => {
          expect(User.prototype.schema.collars.columns.tagName.dbType).toEqual('character varying')
        })
      })

      context('integer', () => {
        it('renders "integer" for dbType', () => {
          expect(User.prototype.schema.collars.columns.position.dbType).toEqual('integer')
        })
      })

      context('citext', () => {
        it('renders "citext" for dbType', () => {
          expect(User.prototype.schema.users.columns.favoriteWord.dbType).toEqual('citext')
        })
      })

      context('primitive (in this case, integer) array type', () => {
        it('renders "integer[]" for integer[] dbType', () => {
          expect(User.prototype.schema.users.columns.favoriteNumbers.dbType).toEqual('integer[]')
          expect(User.prototype.schema.users.columns.favoriteNumbers.enumValues).toBeNull()
        })

        it('renders "timestamp[]" for timestamp[] dbType', () => {
          expect(User.prototype.schema.users.columns.favoriteDatetimes.dbType).toEqual(
            'timestamp without time zone[]'
          )
          expect(User.prototype.schema.users.columns.favoriteDatetimes.enumValues).toBeNull()
        })
      })

      context('enum', () => {
        it('renders the enum name for dbType', () => {
          expect(User.prototype.schema.beautiful_balloons.columns.color.dbType).toEqual('balloon_colors_enum')
        })

        it('sets enum-specific fields', () => {
          expect(User.prototype.schema.beautiful_balloons.columns.color.enumValues).toEqual(
            BalloonColorsEnumValues
          )
        })

        context('enum array', () => {
          it('renders the enum name[] for dbType', () => {
            expect(User.prototype.schema.beautiful_balloons.columns.multicolor.dbType).toEqual(
              'balloon_colors_enum[]'
            )
          })

          it('sets enum-specific fields', () => {
            expect(User.prototype.schema.beautiful_balloons.columns.multicolor.enumValues).toEqual(
              BalloonColorsEnumValues
            )
            expect(User.prototype.schema.beautiful_balloons.columns.multicolor.isArray).toEqual(true)
          })
        })
      })

      context('for a column that allows null', () => {
        it('sets allowNull to true', () => {
          expect(User.prototype.schema.collars.columns.balloonId.allowNull).toEqual(true)
        })
      })
    })

    context('jsonColumnNames', () => {
      it('omits non-json column names', () => {
        expect(User.prototype.schema.model_for_openapi_type_specs.jsonColumnNames).not.toEqual(
          expect.arrayContaining(['name', 'nicknames', 'birthdate', 'volume'])
        )
      })

      it('includes json column names', () => {
        expect(User.prototype.schema.model_for_openapi_type_specs.jsonColumnNames).toEqual(
          expect.arrayContaining(['jsonData', 'jsonbData', 'favoriteJsons', 'favoriteJsonbs'])
        )
      })
    })

    context('primaryKey', () => {
      it('sets the primaryKey', () => {
        expect(User.prototype.schema.users.primaryKey).toEqual('id')
      })
    })

    context('createdAtField', () => {
      it('sets the createdAtField', () => {
        expect(User.prototype.schema.users.createdAtField).toEqual('createdAt')
        // createdAt intentionally points to updatedAt on this model
        expect(User.prototype.schema.model_without_custom_deleted_ats.createdAtField).toEqual('updatedAt')
      })
    })

    context('scopes', () => {
      it('sets the default and non-default scopes', () => {
        expect(User.prototype.schema.model_without_deleted_ats.scopes.default).toEqual([
          'dream:SoftDelete',
          'howyadoin',
        ])
        expect(User.prototype.schema.beautiful_balloons.scopes.default).toEqual([
          'dream:STI',
          'dream:SoftDelete',
        ])
        expect(User.prototype.schema.users.scopes.named).toEqual(['withFunnyName'])
      })
    })

    context('serializerKeys', () => {
      it('sets the serializerKeys', () => {
        expect(User.prototype.schema.users.serializerKeys).toEqual(['default', 'summary'])
      })

      context('on an STI table name', () => {
        it('is all the serializers available across all STI children', () => {
          expect(User.prototype.schema.beautiful_balloons.serializerKeys).toEqual([
            'allBalloonStiChildren',
            'default',
          ])
        })
      })
    })

    context('updatedAtField', () => {
      it('sets the updatedAtField', () => {
        expect(User.prototype.schema.users.updatedAtField).toEqual('updatedAt')
        // updatedAt intentionally points to createdAt on this model
        expect(User.prototype.schema.model_without_custom_deleted_ats.updatedAtField).toEqual('createdAt')
      })
    })

    context('deletedAtField', () => {
      it('sets the deletedAtField', () => {
        expect(User.prototype.schema.users.deletedAtField).toEqual('deletedAt')
        // deleteAt intentionally points to id on this model
        expect(User.prototype.schema.model_without_custom_deleted_ats.deletedAtField).toEqual('id')
      })
    })

    context('associations', () => {
      it('renders correct association data', () => {
        expect(User.prototype.schema.collars.associations.pet).toEqual({
          type: 'BelongsTo',
          tables: ['pets'],
          optional: false,
          foreignKey: 'petId',
          requiredOnClauses: null,
        })
      })

      it('renders required where clauses', () => {
        expect(User.prototype.schema.compositions.associations.requiredCurrentLocalizedText).toEqual({
          type: 'HasOne',
          foreignKey: 'localizableId',
          tables: ['localized_texts'],
          optional: null,
          requiredOnClauses: ['locale'],
        })
      })
    })
  })
})
