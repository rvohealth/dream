import {
  dreamColumnOpenapiShape,
  UseCustomOpenapiForJson,
} from '../../../../src/openapi/dreamAttributeOpenapiShape.js'
import { OpenapiSchemaBody } from '../../../../src/types/openapi.js'
import ModelForOpenapiTypeSpecs from '../../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
import { PetTreatsEnumValues, SpeciesTypesEnumValues } from '../../../../test-app/types/db.js'

describe('dreamAttributeOpenapiShape', () => {
  context('bigint primaryKey', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'id')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: 'string',
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })
  })

  context('varchar', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'name')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'email')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('varchar[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'nicknames')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'string',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredNicknames')
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
      const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'notes')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'bio')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('text[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteTexts')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'string',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredFavoriteTexts')
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
      const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteCitext')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredFavoriteCitext')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('citext[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteCitexts')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'string',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredFavoriteCitexts')
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
      const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'optionalUuid')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'uuid')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('uuid[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteUuids')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'string',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredFavoriteUuids')
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
      const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'birthdate')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
        format: 'date',
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'createdOn')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
          format: 'date',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('date[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteDates')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'string',
            format: 'date',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredFavoriteDates')
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
        const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'createdAt')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
          format: 'date-time',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('timestamp[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteDatetimes')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'string',
            format: 'date-time',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredFavoriteDatetimes')
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
      const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'collarCountInt')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['integer', 'null'],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredCollarCountInt')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'integer',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('integer[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteIntegers')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'integer',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredFavoriteIntegers')
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
      const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'volume')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['number', 'null'],
        format: 'decimal',
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })
  })

  context('numeric', () => {
    it('generates the expected Openapi shape', () => {
      const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'collarCountNumeric')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['number', 'null'],
        format: 'decimal',
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('numeric[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteNumerics')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'number',
            format: 'decimal',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredFavoriteNumerics')
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
      const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteBigint')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredFavoriteBigint')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('bigint[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteBigints')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'string',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredFavoriteBigints')
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
      const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'likesWalks')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['boolean', 'null'],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('notNull', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'likesTreats')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'boolean',
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })

    context('boolean[]', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteBooleans')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'boolean',
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })

      context('notNull', () => {
        it('generates the expected Openapi shape', () => {
          const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'requiredFavoriteBooleans')
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
      const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'species')
      const expectedOpenapiShape: OpenapiSchemaBody = {
        type: ['string', 'null'],
        enum: [...SpeciesTypesEnumValues],
      }

      expect(openApiShape).toEqual(expectedOpenapiShape)
    })

    context('enum array', () => {
      it('generates the expected Openapi shape', () => {
        const openApiShape = dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteTreats')
        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['array', 'null'],
          items: {
            type: 'string',
            enum: [...PetTreatsEnumValues],
          },
        }

        expect(openApiShape).toEqual(expectedOpenapiShape)
      })
    })
  })

  context('json', () => {
    it('generates the expected Openapi shape', () => {
      expect(() => dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'jsonData')).toThrow(
        UseCustomOpenapiForJson
      )
    })
  })

  context('json[]', () => {
    it('generates the expected Openapi shape', () => {
      expect(() => dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteJsons')).toThrow(
        UseCustomOpenapiForJson
      )
    })
  })

  context('jsonb', () => {
    it('generates the expected Openapi shape', () => {
      expect(() => dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'jsonbData')).toThrow(
        UseCustomOpenapiForJson
      )
    })
  })

  context('jsonb[]', () => {
    it('generates the expected Openapi shape', () => {
      expect(() => dreamColumnOpenapiShape(ModelForOpenapiTypeSpecs, 'favoriteJsonbs')).toThrow(
        UseCustomOpenapiForJson
      )
    })
  })
})
