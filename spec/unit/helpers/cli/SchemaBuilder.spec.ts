// NOTE: since schema builder is responsible for writing db/schema.ts,
// we can simply examine the schema.ts file to ensure that it is properly
// written

import User from '../../../../test-app/app/models/User'
import { BalloonColorsEnumValues } from '../../../../test-app/db/schema'

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

      context('integer', () => {
        it('renders "integer" for dbType', () => {
          expect(User.prototype.dreamconf.schema.collars.columns.createdAt.dbType).toEqual(
            'timestamp without time zone'
          )
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

    context('associations', () => {
      it('renders correct association data', () => {
        expect(User.prototype.dreamconf.schema.collars.associations.pet).toEqual({
          type: 'BelongsTo',
          tables: ['pets'],
          optional: false,
        })
      })
    })
  })
})
