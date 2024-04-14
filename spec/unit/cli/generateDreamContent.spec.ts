import generateDreamContent from '../../../src/helpers/cli/generateDreamContent'

describe('dream generate:model <name> [...attributes]', () => {
  context('when provided with a pascalized table name', () => {
    it.only('generates a dream model with multiple string fields', async () => {
      const res = await generateDreamContent('MealType', [])
      expect(res).toEqual(
        `\
import { DateTime } from 'luxon'
import { Dream, IdType } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import MealTypeSerializer from '../../../test-app/app/serializers/MealTypeSerializer'

export default class MealType extends ApplicationModel {
  public get table() {
    return 'meal_types' as const
  }

  public get serializer() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return MealTypeSerializer<any>
  }

  public id: IdType
  public createdAt: DateTime
  public updatedAt: DateTime
}\
`
      )
    })
  })

  context('when provided attributes', () => {
    context('with a string attribute', () => {
      it('generates a dream model with multiple string fields', async () => {
        const res = await generateDreamContent('user', ['email:string', 'password_digest:string'])
        expect(res).toEqual(
          `\
  import { DateTime } from 'luxon'
  import { Dream, IdType } from '@rvohealth/dream'
  import ApplicationModel from './ApplicationModel'
  import UserSerializer from '../../../test-app/app/serializers/UserSerializer'

  export default class User extends ApplicationModel {
    public get table() {
      return 'users' as const
    }

    public get serializer() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return UserSerializer<any>
    }

    public id: IdType
    public email: string
    public passwordDigest: string
    public createdAt: DateTime
    public updatedAt: DateTime
  }\
  `
        )
      })
    })

    context('with enum attributes', () => {
      it('generates a dream model with multiple enum fields', async () => {
        const res = await generateDreamContent('chalupa', [
          'topping:enum:topping:cheese,baja_sauce',
          'protein:enum:protein:beef,non_beef',
          'existing_enum:enum:my_existing_enum',
        ])
        expect(res).toEqual(
          `\
  import { DateTime } from 'luxon'
  import { Dream, IdType } from '@rvohealth/dream'
  import ApplicationModel from './ApplicationModel'
  import ChalupaSerializer from '../../../test-app/app/serializers/ChalupaSerializer'
  import { ToppingEnum, ProteinEnum, MyExistingEnumEnum } from '../../../test-app/db/schema'

  export default class Chalupa extends ApplicationModel {
    public get table() {
      return 'chalupas' as const
    }

    public get serializer() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ChalupaSerializer<any>
    }

    public id: IdType
    public topping: ToppingEnum
    public protein: ProteinEnum
    public existingEnum: MyExistingEnumEnum
    public createdAt: DateTime
    public updatedAt: DateTime
  }\
  `
        )
      })
    })

    context('when name has an uncountable rule applied in inflections conf', () => {
      it('respects inflections conf while generating model name', async () => {
        const res = await generateDreamContent('paper', ['name:string'])
        expect(res).toEqual(
          `\
  import { DateTime } from 'luxon'
  import { Dream, IdType } from '@rvohealth/dream'
  import ApplicationModel from './ApplicationModel'
  import PaperSerializer from '../../../test-app/app/serializers/PaperSerializer'

  export default class Paper extends ApplicationModel {
    public get table() {
      return 'paper' as const
    }

    public get serializer() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return PaperSerializer<any>
    }

    public id: IdType
    public name: string
    public createdAt: DateTime
    public updatedAt: DateTime
  }\
  `
        )
      })
    })

    context('with an integer attribute', () => {
      it('generates a dream model with a number field', async () => {
        const res = await generateDreamContent('user', ['chalupa_count:integer'])
        expectSingleColumnWithType(res, 'chalupaCount', 'number')
      })
    })

    context('with a decimal attribute', () => {
      it('generates a dream model with a number field', async () => {
        const res = await generateDreamContent('user', ['chalupa_count:decimal'])
        expectSingleColumnWithType(res, 'chalupaCount', 'number')
      })
    })

    context('with a float attribute', () => {
      it('generates a dream model with a number field', async () => {
        const res = await generateDreamContent('user', ['chalupa_count:float'])
        expectSingleColumnWithType(res, 'chalupaCount', 'number')
      })
    })

    context('with a datetime attribute', () => {
      it('generates a dream model with a timestamp field', async () => {
        const res = await generateDreamContent('user', ['chalupafied_at:datetime'])
        expectSingleColumnWithType(res, 'chalupafiedAt', 'DateTime')
      })
    })

    context('with a timestamp attribute', () => {
      it('generates a dream model with a timestamp field', async () => {
        const res = await generateDreamContent('user', ['chalupafied_at:timestamp'])
        expectSingleColumnWithType(res, 'chalupafiedAt', 'DateTime')
      })
    })

    context('with a citext attribute', () => {
      it('generates a dream model with a citext field', async () => {
        const res = await generateDreamContent('user', ['name:citext'])
        expectSingleColumnWithType(res, 'name', 'string')
      })
    })

    context('with a json attribute', () => {
      it('generates a dream model with a string field', async () => {
        const res = await generateDreamContent('user', ['chalupa_data:json'])
        expectSingleColumnWithType(res, 'chalupaData', 'string')
      })
    })

    context('with a jsonb attribute', () => {
      it('generates a dream model with a string field', async () => {
        const res = await generateDreamContent('user', ['chalupa_data:jsonb'])
        expectSingleColumnWithType(res, 'chalupaData', 'string')
      })
    })

    context('relationships', () => {
      context('when provided with a belongsTo relationship', () => {
        it('generates a BelongsTo relationship in model', async () => {
          const res = await generateDreamContent('composition', ['graph_node:belongs_to'])
          expect(res).toEqual(
            `\
  import { DateTime } from 'luxon'
  import { Dream, IdType, BelongsTo } from '@rvohealth/dream'
  import ApplicationModel from './ApplicationModel'
  import CompositionSerializer from '../../../test-app/app/serializers/CompositionSerializer'
  import GraphNode from './GraphNode'

  export default class Composition extends ApplicationModel {
    public get table() {
      return 'compositions' as const
    }

    public get serializer() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return CompositionSerializer<any>
    }

    public id: IdType
    public createdAt: DateTime
    public updatedAt: DateTime

    @BelongsTo(() => GraphNode)
    public graphNode: GraphNode
    public graphNodeId: IdType
  }\
  `
          )
        })

        context('namespaced relationships', () => {
          it('can handle belongs to associations with nested paths', async () => {
            const res = await generateDreamContent('cat_toy', ['pet/domestic/cat:belongs_to'])
            expect(res).toEqual(
              `\
  import { DateTime } from 'luxon'
  import { Dream, IdType, BelongsTo } from '@rvohealth/dream'
  import ApplicationModel from './ApplicationModel'
  import CatToySerializer from '../../../test-app/app/serializers/CatToySerializer'
  import Cat from './Pet/Domestic/Cat'

  export default class CatToy extends ApplicationModel {
    public get table() {
      return 'cat_toys' as const
    }

    public get serializer() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return CatToySerializer<any>
    }

    public id: IdType
    public createdAt: DateTime
    public updatedAt: DateTime

    @BelongsTo(() => Cat)
    public cat: Cat
    public catId: IdType
  }\
  `
            )
          })

          it('can handle has many associations with nested paths', async () => {
            const res = await generateDreamContent('cat_toy', ['pet/domestic/cat:has_many'])
            expect(res).toEqual(
              `\
  import { DateTime } from 'luxon'
  import { Dream, IdType, HasMany } from '@rvohealth/dream'
  import ApplicationModel from './ApplicationModel'
  import CatToySerializer from '../../../test-app/app/serializers/CatToySerializer'
  import Cat from './Pet/Domestic/Cat'

  export default class CatToy extends ApplicationModel {
    public get table() {
      return 'cat_toys' as const
    }

    public get serializer() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return CatToySerializer<any>
    }

    public id: IdType
    public createdAt: DateTime
    public updatedAt: DateTime

    @HasMany(() => Cat)
    public cats: Cat[]
  }\
  `
            )
          })

          it('can handle has one associations with nested paths', async () => {
            const res = await generateDreamContent('cat_toy', ['pet/domestic/cat:has_one'])
            expect(res).toEqual(
              `\
  import { DateTime } from 'luxon'
  import { Dream, IdType, HasOne } from '@rvohealth/dream'
  import ApplicationModel from './ApplicationModel'
  import CatToySerializer from '../../../test-app/app/serializers/CatToySerializer'
  import Cat from './Pet/Domestic/Cat'

  export default class CatToy extends ApplicationModel {
    public get table() {
      return 'cat_toys' as const
    }

    public get serializer() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return CatToySerializer<any>
    }

    public id: IdType
    public createdAt: DateTime
    public updatedAt: DateTime

    @HasOne(() => Cat)
    public cat: Cat
  }\
  `
            )
          })

          it('produces valid association paths when the model being generated is namespaced', async () => {
            const res = await generateDreamContent('pet/domestic/cat', ['graph_node:belongs_to'])
            expect(res).toEqual(
              `\
  import { DateTime } from 'luxon'
  import { Dream, IdType, BelongsTo } from '@rvohealth/dream'
  import ApplicationModel from '../../ApplicationModel'
  import PetDomesticCatSerializer from '../../../../../test-app/app/serializers/Pet/Domestic/CatSerializer'
  import GraphNode from '../../GraphNode'

  export default class Cat extends ApplicationModel {
    public get table() {
      return 'pet_domestic_cats' as const
    }

    public get serializer() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return PetDomesticCatSerializer<any>
    }

    public id: IdType
    public createdAt: DateTime
    public updatedAt: DateTime

    @BelongsTo(() => GraphNode)
    public graphNode: GraphNode
    public graphNodeId: IdType
  }\
  `
            )
          })

          it('produces valid association paths when both the model being generated and the associated model are namespaced', async () => {
            const res = await generateDreamContent('pet/domestic/cat', ['pet/domestic/dog:belongs_to'])
            expect(res).toEqual(
              `\
  import { DateTime } from 'luxon'
  import { Dream, IdType, BelongsTo } from '@rvohealth/dream'
  import ApplicationModel from '../../ApplicationModel'
  import PetDomesticCatSerializer from '../../../../../test-app/app/serializers/Pet/Domestic/CatSerializer'
  import Dog from '../../Pet/Domestic/Dog'

  export default class Cat extends ApplicationModel {
    public get table() {
      return 'pet_domestic_cats' as const
    }

    public get serializer() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return PetDomesticCatSerializer<any>
    }

    public id: IdType
    public createdAt: DateTime
    public updatedAt: DateTime

    @BelongsTo(() => Dog)
    public dog: Dog
    public dogId: IdType
  }\
  `
            )
          })

          it('produces valid association paths when both the model being generated and the associated model are namespaced', async () => {
            const res = await generateDreamContent('pet/wild/cat', ['pet/domestic/dog:belongs_to'])
            expect(res).toEqual(
              `\
  import { DateTime } from 'luxon'
  import { Dream, IdType, BelongsTo } from '@rvohealth/dream'
  import ApplicationModel from '../../ApplicationModel'
  import PetWildCatSerializer from '../../../../../test-app/app/serializers/Pet/Wild/CatSerializer'
  import Dog from '../../Pet/Domestic/Dog'

  export default class Cat extends ApplicationModel {
    public get table() {
      return 'pet_wild_cats' as const
    }

    public get serializer() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return PetWildCatSerializer<any>
    }

    public id: IdType
    public createdAt: DateTime
    public updatedAt: DateTime

    @BelongsTo(() => Dog)
    public dog: Dog
    public dogId: IdType
  }\
  `
            )
          })
        })

        it('can handle multiple associations without duplicate imports', async () => {
          const res = await generateDreamContent('composition', ['user:belongs_to', 'chalupa:belongs_to'])
          expect(res).toEqual(
            `\
  import { DateTime } from 'luxon'
  import { Dream, IdType, BelongsTo } from '@rvohealth/dream'
  import ApplicationModel from './ApplicationModel'
  import CompositionSerializer from '../../../test-app/app/serializers/CompositionSerializer'
  import User from './User'
  import Chalupa from './Chalupa'

  export default class Composition extends ApplicationModel {
    public get table() {
      return 'compositions' as const
    }

    public get serializer() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return CompositionSerializer<any>
    }

    public id: IdType
    public createdAt: DateTime
    public updatedAt: DateTime

    @BelongsTo(() => User)
    public user: User
    public userId: IdType

    @BelongsTo(() => Chalupa)
    public chalupa: Chalupa
    public chalupaId: IdType
  }\
  `
          )
        })
      })

      context('when provided with a hasOne relationship', () => {
        it('generates a HasOne relationship in model', async () => {
          const res = await generateDreamContent('composition', ['user:has_one'])
          expect(res).toEqual(
            `\
  import { DateTime } from 'luxon'
  import { Dream, IdType, HasOne } from '@rvohealth/dream'
  import ApplicationModel from './ApplicationModel'
  import CompositionSerializer from '../../../test-app/app/serializers/CompositionSerializer'
  import User from './User'

  export default class Composition extends ApplicationModel {
    public get table() {
      return 'compositions' as const
    }

    public get serializer() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return CompositionSerializer<any>
    }

    public id: IdType
    public createdAt: DateTime
    public updatedAt: DateTime

    @HasOne(() => User)
    public user: User
  }\
  `
          )
        })
      })

      context('when provided with a hasMany relationship', () => {
        it('generates a HasMany relationship in model', async () => {
          const res = await generateDreamContent('user', ['composition:has_many'])
          expect(res).toEqual(
            `\
  import { DateTime } from 'luxon'
  import { Dream, IdType, HasMany } from '@rvohealth/dream'
  import ApplicationModel from './ApplicationModel'
  import UserSerializer from '../../../test-app/app/serializers/UserSerializer'
  import Composition from './Composition'

  export default class User extends ApplicationModel {
    public get table() {
      return 'users' as const
    }

    public get serializer() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return UserSerializer<any>
    }

    public id: IdType
    public createdAt: DateTime
    public updatedAt: DateTime

    @HasMany(() => Composition)
    public compositions: Composition[]
  }\
  `
          )
        })
      })

      context('when provided with a relationship and using uuids', () => {
        it('generates a uuid id field for relations relationship in model', async () => {
          const res = await generateDreamContent('composition', ['user:belongs_to'])
          expect(res).toEqual(
            `\
  import { DateTime } from 'luxon'
  import { Dream, IdType, BelongsTo } from '@rvohealth/dream'
  import ApplicationModel from './ApplicationModel'
  import CompositionSerializer from '../../../test-app/app/serializers/CompositionSerializer'
  import User from './User'

  export default class Composition extends ApplicationModel {
    public get table() {
      return 'compositions' as const
    }

    public get serializer() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return CompositionSerializer<any>
    }

    public id: IdType
    public createdAt: DateTime
    public updatedAt: DateTime

    @BelongsTo(() => User)
    public user: User
    public userId: IdType
  }\
  `
          )
        })
      })
    })
  })
})

function expectSingleColumnWithType(response: string, name: string, type: string) {
  expect(response).toEqual(
    `\
import { DateTime } from 'luxon'
import { Dream, IdType } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import UserSerializer from '../../../test-app/app/serializers/UserSerializer'

export default class User extends ApplicationModel {
  public get table() {
    return 'users' as const
  }

  public get serializer() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return UserSerializer<any>
  }

  public id: IdType
  public ${name}: ${type}
  public createdAt: DateTime
  public updatedAt: DateTime
}\
`
  )
}
