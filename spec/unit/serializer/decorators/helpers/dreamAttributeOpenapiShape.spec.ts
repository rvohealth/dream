import { OpenapiSchemaBody } from '../../../../../src/openapi/types'
import {
  dreamAttributeOpenapiShape,
  UseCustomOpenapiForJson,
} from '../../../../../src/serializer/decorators/helpers/dreamAttributeOpenapiShape'
import ModelForOpenapiTypeSpecs from '../../../../../test-app/app/models/ModelForOpenapiTypeSpec'
import { PetTreatsEnumValues, SpeciesTypesEnumValues } from '../../../../../test-app/db/sync'

describe('dreamAttributeOpenapiShape', () => {
  context('bigint primaryKey', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'id')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: 'string',
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })
  })

  context('varchar', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'name')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: 'string',
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'email')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('varchar[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'nicknames')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'string',
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredNicknames')
          const expectedOpenapiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'string',
            },
          }

          expect(openApiShape).toEqual(expectedOpenapiShape)
        })
      })
    })
  })

  context('text', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'notes')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: 'string',
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'bio')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('text[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteTexts')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'string',
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredFavoriteTexts')
          const expectedOpenapiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'string',
            },
          }

          expect(openApiShape).toEqual(expectedOpenapiShape)
        })
      })
    })
  })

  context('citext', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteCitext')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: 'string',
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredFavoriteCitext')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('citext[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteCitexts')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'string',
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredFavoriteCitexts')
          const expectedOpenapiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'string',
            },
          }

          expect(openApiShape).toEqual(expectedOpenapiShape)
        })
      })
    })
  })

  context('uuid', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'optionalUuid')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: 'string',
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'uuid')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('uuid[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteUuids')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'string',
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredFavoriteUuids')
          const expectedOpenapiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'string',
            },
          }

          expect(openApiShape).toEqual(expectedOpenapiShape)
        })
      })
    })
  })

  context('date', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'birthdate')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: 'string',
        format: 'date',
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'createdOn')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
          format: 'date',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('date[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteDates')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'string',
            format: 'date',
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredFavoriteDates')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'string',
            format: 'date',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })
  })

  context('timestamp', () => {
    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'createdAt')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
          format: 'date-time',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('timestamp[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteDatetimes')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'string',
            format: 'date-time',
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamAttributeOpenapiShape(
            ModelForOpenapiTypeSpecs,
            'requiredFavoriteDatetimes'
          )
          const expectedOpenapiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'string',
              format: 'date-time',
            },
          }

          expect(openApiShape).toEqual(expectedOpenapiShape)
        })
      })
    })
  })

  context('integer', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'collarCountInt')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: 'integer',
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredCollarCountInt')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'integer',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('integer[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteIntegers')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'integer',
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamAttributeOpenapiShape(
            ModelForOpenapiTypeSpecs,
            'requiredFavoriteIntegers'
          )
          const expectedOpenapiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'integer',
            },
          }

          expect(openApiShape).toEqual(expectedOpenapiShape)
        })
      })
    })
  })

  context('decimal(6, 3)', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'volume')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: 'number',
        format: 'decimal',
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })
  })

  context('numeric', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'collarCountNumeric')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: 'number',
        format: 'decimal',
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('numeric[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteNumerics')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'number',
            format: 'decimal',
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamAttributeOpenapiShape(
            ModelForOpenapiTypeSpecs,
            'requiredFavoriteNumerics'
          )
          const expectedOpenapiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'number',
              format: 'decimal',
            },
          }

          expect(openApiShape).toEqual(expectedOpenapiShape)
        })
      })
    })
  })

  context('bigint', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteBigint')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: 'string',
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredFavoriteBigint')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('bigint[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteBigints')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'string',
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredFavoriteBigints')
          const expectedOpenapiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'string',
            },
          }

          expect(openApiShape).toEqual(expectedOpenapiShape)
        })
      })
    })
  })

  context('boolean', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'likesWalks')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: 'boolean',
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'likesTreats')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'boolean',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('boolean[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteBooleans')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'boolean',
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamAttributeOpenapiShape(
            ModelForOpenapiTypeSpecs,
            'requiredFavoriteBooleans'
          )
          const expectedOpenapiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'boolean',
            },
          }

          expect(openApiShape).toEqual(expectedOpenapiShape)
        })
      })
    })
  })

  context('enum', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'species')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: 'string',
        enum: [...SpeciesTypesEnumValues, 'null'],
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('enum array', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteTreats')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'string',
            enum: [...PetTreatsEnumValues, 'null'],
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })
  })

  context('json', () => {
    it('generates the expected Openapi shape', () => {
      expect(() => dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'jsonData')).toThrow(
        UseCustomOpenapiForJson
      )
    })
  })

  context('json[]', () => {
    it('generates the expected Openapi shape', () => {
      expect(() => dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteJsons')).toThrow(
        UseCustomOpenapiForJson
      )
    })
  })

  context('jsonb', () => {
    it('generates the expected Openapi shape', () => {
      expect(() => dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'jsonbData')).toThrow(
        UseCustomOpenapiForJson
      )
    })
  })

  context('jsonb[]', () => {
    it('generates the expected Openapi shape', () => {
      expect(() => dreamAttributeOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteJsonbs')).toThrow(
        UseCustomOpenapiForJson
      )
    })
  })
})
