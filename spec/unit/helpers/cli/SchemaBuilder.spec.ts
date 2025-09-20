// NOTE: since schema builder is responsible for writing types/dream.ts,
// we can simply examine the types/dream.ts file to ensure that it is properly
// written

import AlternateDbConnectionUser from '../../../../test-app/app/models/AlternateDbConnectionUser.js'
import User from '../../../../test-app/app/models/User.js'
import { BalloonColorsEnumValues } from '../../../../test-app/types/db.js'

describe('SchemaBuilder', () => {
  describe('#build', () => {
    context('globalNames', () => {
      it('renders models key value pairs per-connection', () => {
        const defaultConnectionValues = { 'Graph/Edge': 'graph_edges', User: 'users' }
        const alternateConnectionValues = {
          AlternateDbConnectionUser: 'alternate_db_connection_users',
          AlternateDbConnectionPost: 'alternate_db_connection_posts',
        }

        expect(User.prototype.connectionTypeConfig.globalNames.models).toEqual(
          expect.objectContaining(defaultConnectionValues)
        )
        expect(User.prototype.connectionTypeConfig.globalNames.models).not.toEqual(
          expect.objectContaining(alternateConnectionValues)
        )

        expect(AlternateDbConnectionUser.prototype.connectionTypeConfig.globalNames.models).toEqual(
          expect.objectContaining(alternateConnectionValues)
        )
        expect(AlternateDbConnectionUser.prototype.connectionTypeConfig.globalNames.models).not.toEqual(
          expect.objectContaining(defaultConnectionValues)
        )
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

    context('nonJsonColumnNames', () => {
      it('includes non-json column names', () => {
        expect(User.prototype.schema.model_for_openapi_type_specs.nonJsonColumnNames).toEqual(
          expect.arrayContaining(['name', 'nicknames', 'birthdate', 'volume'])
        )
      })

      it('omits json column names', () => {
        expect(User.prototype.schema.model_for_openapi_type_specs.nonJsonColumnNames).not.toEqual(
          expect.arrayContaining(['jsonData', 'jsonbData', 'favoriteJsons', 'favoriteJsonbs'])
        )
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

      context('alternate connections', () => {
        it('renders unique scopes for alternate connections', () => {
          expect(
            AlternateDbConnectionUser.prototype.schema.alternate_db_connection_users.scopes.default
          ).toEqual(['testDefaultScope'])
          expect(
            AlternateDbConnectionUser.prototype.schema.alternate_db_connection_users.scopes.named
          ).toEqual(['testScope'])
        })
      })
    })

    context('passthrough', () => {
      it('sets the default and non-default scopes', () => {
        expect(User.prototype.connectionTypeConfig.passthroughColumns).toEqual(['locale', 'name'])
      })

      context('alternate connections', () => {
        it('renders unique scopes for alternate connections', () => {
          expect(AlternateDbConnectionUser.prototype.connectionTypeConfig.passthroughColumns).toEqual([
            'body',
          ])
        })
      })
    })

    context('serializerKeys', () => {
      it('sets the serializerKeys', () => {
        expect(User.prototype.schema.users.serializerKeys).toEqual(['deep', 'default', 'summary'])
      })

      context('on an STI table name', () => {
        it('is all the serializers available across all STI children', () => {
          expect(User.prototype.schema.beautiful_balloons.serializerKeys).toEqual([
            'allBalloonStiChildren',
            'default',
            'delegated',
          ])
        })
      })
    })

    context('associations', () => {
      it('renders correct association data', () => {
        expect(User.prototype.schema.collars.associations.pet).toEqual({
          type: 'BelongsTo',
          tables: ['pets'],
          optional: false,
          foreignKey: 'petId',
          foreignKeyTypeColumn: null,
          requiredAndClauses: null,
          passthroughAndClauses: null,
        })
      })

      it('renders required "and" clauses', () => {
        expect(User.prototype.schema.compositions.associations.requiredCurrentLocalizedText).toEqual({
          type: 'HasOne',
          foreignKey: 'localizableId',
          foreignKeyTypeColumn: 'localizableType',
          tables: ['localized_texts'],
          optional: null,
          requiredAndClauses: ['locale'],
          passthroughAndClauses: null,
        })
      })

      it('renders passthrough "and" clauses', () => {
        expect(User.prototype.schema.compositions.associations.passthroughCurrentLocalizedText).toEqual({
          type: 'HasOne',
          foreignKey: 'localizableId',
          foreignKeyTypeColumn: 'localizableType',
          tables: ['localized_texts'],
          optional: null,
          requiredAndClauses: null,
          passthroughAndClauses: ['locale'],
        })
      })

      context('polymorphic type fields', () => {
        it('includes polymorphic type field', () => {
          expect(User.prototype.schema.localized_texts.associations.localizable.foreignKeyTypeColumn).toEqual(
            'localizableType'
          )
        })
      })
    })
  })

  describe('.buildGlobalTypes', () => {
    it('renders serializers array', () => {
      expect(User.prototype.globalTypeConfig.serializers).toEqual(
        expect.arrayContaining(['UserSerializer', 'LocalizedText/BaseSerializer'])
      )
    })
  })
})
