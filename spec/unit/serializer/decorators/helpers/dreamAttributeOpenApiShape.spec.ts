import { OpenapiSchemaBody } from '../../../../../src'
import { dreamAttributeOpenApiShape } from '../../../../../src/serializer/decorators/helpers/dreamAttributeOpenApiShape'
import ModelForOpenApiTypeSpecs from '../../../../../test-app/app/models/ModelForOpenApiTypeSpec'
import { PetTreatsEnumValues, SpeciesTypesEnumValues } from '../../../../../test-app/db/sync'

describe('dreamAttributeOpenApiShape', () => {
  context('bigint primaryKey', () => {
    it('generates the expected OpenApi shape', () => {
      const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'id')
      const expectedOpenApiShape: OpenapiSchemaBody = {
        type: 'string',
      }

      expect(openApiShape).toEqual(expectedOpenApiShape)
    })
  })

  context('varchar', () => {
    it('generates the expected OpenApi shape', () => {
      const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'name')
      const expectedOpenApiShape: OpenapiSchemaBody = {
        type: 'string',
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenApiShape)
    })

    context('notNull', () => {
      it('generates the expected OpenApi shape', () => {
        const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'email')
        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenApiShape)
      })
    })

    context('varchar[]', () => {
      it('generates the expected OpenApi shape', () => {
        const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'nicknames')
        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'string',
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenApiShape)
      })

      context('notNull', () => {
        it('generates the expected OpenApi shape', () => {
          const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'requiredNicknames')
          const expectedOpenApiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'string',
            },
          }

          expect(openApiShape).toEqual(expectedOpenApiShape)
        })
      })
    })
  })

  context('text', () => {
    it('generates the expected OpenApi shape', () => {
      const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'notes')
      const expectedOpenApiShape: OpenapiSchemaBody = {
        type: 'string',
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenApiShape)
    })

    context('notNull', () => {
      it('generates the expected OpenApi shape', () => {
        const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'bio')
        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenApiShape)
      })
    })

    context('text[]', () => {
      it('generates the expected OpenApi shape', () => {
        const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'favoriteTexts')
        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'string',
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenApiShape)
      })

      context('notNull', () => {
        it('generates the expected OpenApi shape', () => {
          const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'requiredFavoriteTexts')
          const expectedOpenApiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'string',
            },
          }

          expect(openApiShape).toEqual(expectedOpenApiShape)
        })
      })
    })
  })

  context('citext', () => {
    it('generates the expected OpenApi shape', () => {
      const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'favoriteCitext')
      const expectedOpenApiShape: OpenapiSchemaBody = {
        type: 'string',
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenApiShape)
    })

    context('notNull', () => {
      it('generates the expected OpenApi shape', () => {
        const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'requiredFavoriteCitext')
        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenApiShape)
      })
    })

    context('citext[]', () => {
      it('generates the expected OpenApi shape', () => {
        const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'favoriteCitexts')
        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'string',
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenApiShape)
      })

      context('notNull', () => {
        it('generates the expected OpenApi shape', () => {
          const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'requiredFavoriteCitexts')
          const expectedOpenApiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'string',
            },
          }

          expect(openApiShape).toEqual(expectedOpenApiShape)
        })
      })
    })
  })

  context('uuid', () => {
    it('generates the expected OpenApi shape', () => {
      const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'optionalUuid')
      const expectedOpenApiShape: OpenapiSchemaBody = {
        type: 'string',
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenApiShape)
    })

    context('notNull', () => {
      it('generates the expected OpenApi shape', () => {
        const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'uuid')
        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenApiShape)
      })
    })

    context('uuid[]', () => {
      it('generates the expected OpenApi shape', () => {
        const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'favoriteUuids')
        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'string',
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenApiShape)
      })

      context('notNull', () => {
        it('generates the expected OpenApi shape', () => {
          const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'requiredFavoriteUuids')
          const expectedOpenApiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'string',
            },
          }

          expect(openApiShape).toEqual(expectedOpenApiShape)
        })
      })
    })
  })

  context('date', () => {
    it('generates the expected OpenApi shape', () => {
      const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'birthdate')
      const expectedOpenApiShape: OpenapiSchemaBody = {
        type: 'string',
        format: 'date',
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenApiShape)
    })

    context('notNull', () => {
      it('generates the expected OpenApi shape', () => {
        const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'createdOn')
        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'string',
          format: 'date',
        }

        expect(openApiShape).toEqual(expectedOpenApiShape)
      })
    })

    context('date[]', () => {
      it('generates the expected OpenApi shape', () => {
        const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'favoriteDates')
        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'string',
            format: 'date',
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenApiShape)
      })
    })

    context('notNull', () => {
      it('generates the expected OpenApi shape', () => {
        const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'requiredFavoriteDates')
        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'string',
            format: 'date',
          },
        }

        expect(openApiShape).toEqual(expectedOpenApiShape)
      })
    })
  })

  context('timestamp', () => {
    context('notNull', () => {
      it('generates the expected OpenApi shape', () => {
        const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'createdAt')
        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'string',
          format: 'date-time',
        }

        expect(openApiShape).toEqual(expectedOpenApiShape)
      })
    })

    context('timestamp[]', () => {
      it('generates the expected OpenApi shape', () => {
        const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'favoriteDatetimes')
        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'string',
            format: 'date-time',
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenApiShape)
      })

      context('notNull', () => {
        it('generates the expected OpenApi shape', () => {
          const openApiShape = dreamAttributeOpenApiShape(
            ModelForOpenApiTypeSpecs,
            'requiredFavoriteDatetimes'
          )
          const expectedOpenApiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'string',
              format: 'date-time',
            },
          }

          expect(openApiShape).toEqual(expectedOpenApiShape)
        })
      })
    })
  })

  context('integer', () => {
    it('generates the expected OpenApi shape', () => {
      const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'collarCountInt')
      const expectedOpenApiShape: OpenapiSchemaBody = {
        type: 'integer',
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenApiShape)
    })

    context('notNull', () => {
      it('generates the expected OpenApi shape', () => {
        const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'requiredCollarCountInt')
        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'integer',
        }

        expect(openApiShape).toEqual(expectedOpenApiShape)
      })
    })

    context('integer[]', () => {
      it('generates the expected OpenApi shape', () => {
        const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'favoriteIntegers')
        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'integer',
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenApiShape)
      })

      context('notNull', () => {
        it('generates the expected OpenApi shape', () => {
          const openApiShape = dreamAttributeOpenApiShape(
            ModelForOpenApiTypeSpecs,
            'requiredFavoriteIntegers'
          )
          const expectedOpenApiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'integer',
            },
          }

          expect(openApiShape).toEqual(expectedOpenApiShape)
        })
      })
    })
  })

  context('decimal(6, 3)', () => {
    it('generates the expected OpenApi shape', () => {
      const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'volume')
      const expectedOpenApiShape: OpenapiSchemaBody = {
        type: 'number',
        format: 'decimal',
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenApiShape)
    })
  })

  context('numeric', () => {
    it('generates the expected OpenApi shape', () => {
      const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'collarCountNumeric')
      const expectedOpenApiShape: OpenapiSchemaBody = {
        type: 'number',
        format: 'decimal',
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenApiShape)
    })

    context('numeric[]', () => {
      it('generates the expected OpenApi shape', () => {
        const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'favoriteNumerics')
        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'number',
            format: 'decimal',
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenApiShape)
      })

      context('notNull', () => {
        it('generates the expected OpenApi shape', () => {
          const openApiShape = dreamAttributeOpenApiShape(
            ModelForOpenApiTypeSpecs,
            'requiredFavoriteNumerics'
          )
          const expectedOpenApiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'number',
              format: 'decimal',
            },
          }

          expect(openApiShape).toEqual(expectedOpenApiShape)
        })
      })
    })
  })

  context('bigint', () => {
    it('generates the expected OpenApi shape', () => {
      const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'favoriteBigint')
      const expectedOpenApiShape: OpenapiSchemaBody = {
        type: 'string',
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenApiShape)
    })

    context('notNull', () => {
      it('generates the expected OpenApi shape', () => {
        const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'requiredFavoriteBigint')
        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'string',
        }

        expect(openApiShape).toEqual(expectedOpenApiShape)
      })
    })

    context('bigint[]', () => {
      it('generates the expected OpenApi shape', () => {
        const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'favoriteBigints')
        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'string',
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenApiShape)
      })

      context('notNull', () => {
        it('generates the expected OpenApi shape', () => {
          const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'requiredFavoriteBigints')
          const expectedOpenApiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'string',
            },
          }

          expect(openApiShape).toEqual(expectedOpenApiShape)
        })
      })
    })
  })

  context('boolean', () => {
    it('generates the expected OpenApi shape', () => {
      const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'likesWalks')
      const expectedOpenApiShape: OpenapiSchemaBody = {
        type: 'boolean',
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenApiShape)
    })

    context('notNull', () => {
      it('generates the expected OpenApi shape', () => {
        const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'likesTreats')
        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'boolean',
        }

        expect(openApiShape).toEqual(expectedOpenApiShape)
      })
    })

    context('boolean[]', () => {
      it('generates the expected OpenApi shape', () => {
        const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'favoriteBooleans')
        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'boolean',
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenApiShape)
      })

      context('notNull', () => {
        it('generates the expected OpenApi shape', () => {
          const openApiShape = dreamAttributeOpenApiShape(
            ModelForOpenApiTypeSpecs,
            'requiredFavoriteBooleans'
          )
          const expectedOpenApiShape: OpenapiSchemaBody = {
            type: 'array',
            items: {
              type: 'boolean',
            },
          }

          expect(openApiShape).toEqual(expectedOpenApiShape)
        })
      })
    })
  })

  context('enum', () => {
    it('generates the expected OpenApi shape', () => {
      const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'species')
      const expectedOpenApiShape: OpenapiSchemaBody = {
        type: 'string',
        enum: SpeciesTypesEnumValues,
        nullable: true,
      }

      expect(openApiShape).toEqual(expectedOpenApiShape)
    })

    context('enum array', () => {
      it('generates the expected OpenApi shape', () => {
        const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'favoriteTreats')
        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'array',
          items: {
            type: 'string',
            enum: PetTreatsEnumValues,
          },
          nullable: true,
        }

        expect(openApiShape).toEqual(expectedOpenApiShape)
      })
    })
  })

  // context("json[]", () => {
  //   it('generates the expected OpenApi shape', () => {
  //     const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'favoriteJsons')
  //     const expectedOpenApiShape: OpenapiSchemaBody = {
  //       type: '',
  //       nullable: true,
  //     }

  //     expect(openApiShape).toEqual(expectedOpenApiShape)
  //      json[])
  //   })
  // })

  // context("json[], notNull", () => {
  //   it('generates the expected OpenApi shape', () => {
  //     const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'requiredFavoriteJsons')
  //     const expectedOpenApiShape: OpenapiSchemaBody = {
  //       type: '',
  //       nullable: true,
  //     }

  //     expect(openApiShape).toEqual(expectedOpenApiShape)
  //      json[], notNull
  //   })
  // })

  // context("jsonb[]", () => {
  //   it('generates the expected OpenApi shape', () => {
  //     const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'favoriteJsonbs')
  //     const expectedOpenApiShape: OpenapiSchemaBody = {
  //       type: '',
  //       nullable: true,
  //     }

  //     expect(openApiShape).toEqual(expectedOpenApiShape)
  //      jsonb[])
  //   })
  // })

  // context("jsonb[], notNull", () => {
  //   it('generates the expected OpenApi shape', () => {
  //     const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'requiredFavoriteJsonbs')
  //     const expectedOpenApiShape: OpenapiSchemaBody = {
  //       type: '',
  //       nullable: true,
  //     }

  //     expect(openApiShape).toEqual(expectedOpenApiShape)
  //      jsonb[], notNull
  //   })
  // })

  // context("jsonb", () => {
  //   it('generates the expected OpenApi shape', () => {
  //     const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'jsonbData')
  //     const expectedOpenApiShape: OpenapiSchemaBody = {
  //       type: '',
  //       nullable: true,
  //     }

  //     expect(openApiShape).toEqual(expectedOpenApiShape)
  //      'jsonb')
  //   })
  // })

  // context("jsonb', col.notNull().defaultTo('{}'))", () => {
  //   it('generates the expected OpenApi shape', () => {
  //     const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'requiredJsonbData')
  //     const expectedOpenApiShape: OpenapiSchemaBody = {
  //       type: '',
  //       nullable: true,
  //     }

  //     expect(openApiShape).toEqual(expectedOpenApiShape)
  //      'jsonb', col.notNull().defaultTo('{}'))
  //   })
  // })

  // context("json", () => {
  //   it('generates the expected OpenApi shape', () => {
  //     const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'jsonData')
  //     const expectedOpenApiShape: OpenapiSchemaBody = {
  //       type: '',
  //       nullable: true,
  //     }

  //     expect(openApiShape).toEqual(expectedOpenApiShape)
  //      'json')
  //   })
  // })

  // context("json', col.notNull().defaultTo('{}'))", () => {
  //   it('generates the expected OpenApi shape', () => {
  //     const openApiShape = dreamAttributeOpenApiShape(ModelForOpenApiTypeSpecs, 'requiredJsonData')
  //     const expectedOpenApiShape: OpenapiSchemaBody = {
  //       type: '',
  //       nullable: true,
  //     }

  //     expect(openApiShape).toEqual(expectedOpenApiShape)
  //      'json', col.notNull().defaultTo('{}'))
  //   })
  // })
})
