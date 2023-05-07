import generateDreamContent from '../../../src/helpers/cli/generateDreamContent'

describe('howl generate:model <name> [...attributes]', () => {
  context('when provided with a pascalized table name', () => {
    it('generates a dream model with multiple string fields', async () => {
      const res = generateDreamContent('MealType', [], { useUUID: false })
      expect(res).toEqual(
        `\
import { DateTime } from 'luxon'
import { Dream } from 'dream'

export default class MealType extends Dream {
  public get table() {
    return 'meal_types' as const
  }

  public id: IdType
  public created_at: DateTime
  public updated_at: DateTime
}\
`
      )
    })
  })

  context('when provided attributes', () => {
    context('with a string attribute', () => {
      it('generates a dream model with multiple string fields', async () => {
        const res = generateDreamContent('user', ['email:string', 'password_digest:string'], {
          useUUID: false,
        })
        expect(res).toEqual(
          `\
import { DateTime } from 'luxon'
import { Dream } from 'dream'

export default class User extends Dream {
  public get table() {
    return 'users' as const
  }

  public id: IdType
  public email: string
  public password_digest: string
  public created_at: DateTime
  public updated_at: DateTime
}\
`
        )
      })
    })

    context('with enum attributes', () => {
      it('generates a dream model with multiple enum fields', async () => {
        const res = generateDreamContent(
          'chalupa',
          [
            'topping:enum:topping:cheese,baja_sauce',
            'protein:enum:protein:beef,non_beef',
            'existing_enum:enum:my_existing_enum',
          ],
          {
            useUUID: false,
          }
        )
        expect(res).toEqual(
          `\
import { DateTime } from 'luxon'
import { Dream } from 'dream'
import { ToppingEnum, ProteinEnum, MyExistingEnumEnum } from '../../db/schema'

export default class Chalupa extends Dream {
  public get table() {
    return 'chalupas' as const
  }

  public id: IdType
  public topping: ToppingEnum
  public protein: ProteinEnum
  public existing_enum: MyExistingEnumEnum
  public created_at: DateTime
  public updated_at: DateTime
}\
`
        )
      })
    })

    context('with an integer attribute', () => {
      it('generates a dream model with a number field', async () => {
        const res = generateDreamContent('user', ['chalupa_count:integer'], {
          useUUID: false,
        })
        expectSingleColumnWithType(res, 'chalupa_count', 'number', 'integer')
      })
    })

    context('with a float attribute', () => {
      it('generates a dream model with a number field', async () => {
        const res = generateDreamContent('user', ['chalupa_count:float'], {
          useUUID: false,
        })
        expectSingleColumnWithType(res, 'chalupa_count', 'number', 'float')
      })
    })

    context('with a datetime attribute', () => {
      it('generates a dream model with a timestamp field', async () => {
        const res = generateDreamContent('user', ['chalupafied_at:datetime'], {
          useUUID: false,
        })
        expectSingleColumnWithType(res, 'chalupafied_at', 'DateTime', 'datetime')
      })
    })

    context('with a timestamp attribute', () => {
      it('generates a dream model with a timestamp field', async () => {
        const res = generateDreamContent('user', ['chalupafied_at:timestamp'], {
          useUUID: false,
        })
        expectSingleColumnWithType(res, 'chalupafied_at', 'DateTime', 'datetime')
      })
    })

    context('with a citext attribute', () => {
      it('generates a dream model with a citext field', async () => {
        const res = generateDreamContent('user', ['name:citext'], {
          useUUID: false,
        })
        expectSingleColumnWithType(res, 'name', 'string', 'citext')
      })
    })

    context('with a json attribute', () => {
      it('generates a dream model with a string field', async () => {
        const res = generateDreamContent('user', ['chalupa_data:json'], {
          useUUID: false,
        })
        expectSingleColumnWithType(res, 'chalupa_data', 'string', 'json')
      })
    })

    context('with a jsonb attribute', () => {
      it('generates a dream model with a string field', async () => {
        const res = generateDreamContent('user', ['chalupa_data:jsonb'], {
          useUUID: false,
        })
        expectSingleColumnWithType(res, 'chalupa_data', 'string', 'jsonb')
      })
    })

    context('relationships', () => {
      context('when provided with a belongs_to relationship', () => {
        it('generates a BelongsTo relationship in model', () => {
          const res = generateDreamContent('composition', ['graph_node:belongs_to'], {
            useUUID: false,
          })
          expect(res).toEqual(
            `\
import { DateTime } from 'luxon'
import { Dream, IdType, BelongsTo } from 'dream'
import GraphNode from './GraphNode'

export default class Composition extends Dream {
  public get table() {
    return 'compositions' as const
  }

  public id: IdType
  public created_at: DateTime
  public updated_at: DateTime

  @BelongsTo(() => GraphNode)
  public graphNode: GraphNode
  public graph_node_id: IdType
}\
`
          )
        })

        context('namespaced relationships', () => {
          it('can handle belongs to associations with nested paths', () => {
            const res = generateDreamContent('cat_toy', ['pet/domestic/cat:belongs_to'], {
              useUUID: false,
            })
            expect(res).toEqual(
              `\
import { DateTime } from 'luxon'
import { Dream, IdType, BelongsTo } from 'dream'
import Cat from './Pet/Domestic/Cat'

export default class CatToy extends Dream {
  public get table() {
    return 'cat_toys' as const
  }

  public id: IdType
  public created_at: DateTime
  public updated_at: DateTime

  @BelongsTo(() => Cat)
  public cat: Cat
  public cat_id: IdType
}\
`
            )
          })

          it('can handle has many associations with nested paths', () => {
            const res = generateDreamContent('cat_toy', ['pet/domestic/cat:has_many'], {
              useUUID: false,
            })
            expect(res).toEqual(
              `\
import { DateTime } from 'luxon'
import { Dream, HasMany } from 'dream'
import Cat from './Pet/Domestic/Cat'

export default class CatToy extends Dream {
  public get table() {
    return 'cat_toys' as const
  }

  public id: IdType
  public created_at: DateTime
  public updated_at: DateTime

  @HasMany(() => Cat)
  public cats: Cat[]
}\
`
            )
          })

          it('can handle has one associations with nested paths', () => {
            const res = generateDreamContent('cat_toy', ['pet/domestic/cat:has_one'], {
              useUUID: false,
            })
            expect(res).toEqual(
              `\
import { DateTime } from 'luxon'
import { Dream, HasOne } from 'dream'
import Cat from './Pet/Domestic/Cat'

export default class CatToy extends Dream {
  public get table() {
    return 'cat_toys' as const
  }

  public id: IdType
  public created_at: DateTime
  public updated_at: DateTime

  @HasOne(() => Cat)
  public cat: Cat
}\
`
            )
          })

          it('produces valid association paths when the model being generated is namespaced', () => {
            const res = generateDreamContent('pet/domestic/cat', ['graph_node:belongs_to'], {
              useUUID: false,
            })
            expect(res).toEqual(
              `\
import { DateTime } from 'luxon'
import { Dream, IdType, BelongsTo } from 'dream'
import GraphNode from '../../GraphNode'

export default class Cat extends Dream {
  public get table() {
    return 'pet_domestic_cats' as const
  }

  public id: IdType
  public created_at: DateTime
  public updated_at: DateTime

  @BelongsTo(() => GraphNode)
  public graphNode: GraphNode
  public graph_node_id: IdType
}\
`
            )
          })

          it('produces valid association paths when both the model being generated and the associated model are namespaced', () => {
            const res = generateDreamContent('pet/domestic/cat', ['pet/domestic/dog:belongs_to'], {
              useUUID: false,
            })
            expect(res).toEqual(
              `\
import { DateTime } from 'luxon'
import { Dream, IdType, BelongsTo } from 'dream'
import Dog from '../../Pet/Domestic/Dog'

export default class Cat extends Dream {
  public get table() {
    return 'pet_domestic_cats' as const
  }

  public id: IdType
  public created_at: DateTime
  public updated_at: DateTime

  @BelongsTo(() => Dog)
  public dog: Dog
  public dog_id: IdType
}\
`
            )
          })

          it('produces valid association paths when both the model being generated and the associated model are namespaced', () => {
            const res = generateDreamContent('pet/wild/cat', ['pet/domestic/dog:belongs_to'], {
              useUUID: false,
            })
            expect(res).toEqual(
              `\
import { DateTime } from 'luxon'
import { Dream, IdType, BelongsTo } from 'dream'
import Dog from '../../Pet/Domestic/Dog'

export default class Cat extends Dream {
  public get table() {
    return 'pet_wild_cats' as const
  }

  public id: IdType
  public created_at: DateTime
  public updated_at: DateTime

  @BelongsTo(() => Dog)
  public dog: Dog
  public dog_id: IdType
}\
`
            )
          })
        })

        it('can handle multiple associations without duplicate imports', () => {
          const res = generateDreamContent('composition', ['user:belongs_to', 'chalupa:belongs_to'], {
            useUUID: false,
          })
          expect(res).toEqual(
            `\
import { DateTime } from 'luxon'
import { Dream, IdType, BelongsTo } from 'dream'
import User from './User'
import Chalupa from './Chalupa'

export default class Composition extends Dream {
  public get table() {
    return 'compositions' as const
  }

  public id: IdType
  public created_at: DateTime
  public updated_at: DateTime

  @BelongsTo(() => User)
  public user: User
  public user_id: IdType

  @BelongsTo(() => Chalupa)
  public chalupa: Chalupa
  public chalupa_id: IdType
}\
`
          )
        })
      })

      context('when provided with a has_one relationship', () => {
        it('generates a HasOne relationship in model', () => {
          const res = generateDreamContent('composition', ['user:has_one'], {
            useUUID: false,
          })
          expect(res).toEqual(
            `\
import { DateTime } from 'luxon'
import { Dream, HasOne } from 'dream'
import User from './User'

export default class Composition extends Dream {
  public get table() {
    return 'compositions' as const
  }

  public id: IdType
  public created_at: DateTime
  public updated_at: DateTime

  @HasOne(() => User)
  public user: User
}\
`
          )
        })
      })

      context('when provided with a has_many relationship', () => {
        it('generates a HasMany relationship in model', () => {
          const res = generateDreamContent('user', ['composition:has_many'], {
            useUUID: false,
          })
          expect(res).toEqual(
            `\
import { DateTime } from 'luxon'
import { Dream, HasMany } from 'dream'
import Composition from './Composition'

export default class User extends Dream {
  public get table() {
    return 'users' as const
  }

  public id: IdType
  public created_at: DateTime
  public updated_at: DateTime

  @HasMany(() => Composition)
  public compositions: Composition[]
}\
`
          )
        })
      })

      context('when provided with a relationship and using uuids', () => {
        it('generates a uuid id field for relations relationship in model', () => {
          const res = generateDreamContent('composition', ['user:belongs_to'], {
            useUUID: true,
          })
          expect(res).toEqual(
            `\
import { DateTime } from 'luxon'
import { Dream, IdType, BelongsTo } from 'dream'
import User from './User'

export default class Composition extends Dream {
  public get table() {
    return 'compositions' as const
  }

  public id: IdType
  public created_at: DateTime
  public updated_at: DateTime

  @BelongsTo(() => User)
  public user: User
  public user_id: IdType
}\
`
          )
        })
      })
    })
  })
})

function expectSingleColumnWithType(response: string, name: string, type: string, dbType: string = type) {
  expect(response).toEqual(
    `\
import { DateTime } from 'luxon'
import { Dream } from 'dream'

export default class User extends Dream {
  public get table() {
    return 'users' as const
  }

  public id: IdType
  public ${name}: ${type}
  public created_at: DateTime
  public updated_at: DateTime
}\
`
  )
}
