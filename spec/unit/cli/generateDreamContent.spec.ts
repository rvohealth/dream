import generateDreamContent from '../../../src/helpers/cli/generateDreamContent'

describe('dream generate:model <name> [...attributes]', () => {
  context('when provided with a pascalized model name', () => {
    it('generates a dream model with multiple string fields', async () => {
      const res = await generateDreamContent('MealType', [])
      expect(res).toEqual(
        `\
import { DreamColumn } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import MealTypeSerializer, { MealTypeSummarySerializer } from '../../../test-app/app/serializers/MealTypeSerializer'

export default class MealType extends ApplicationModel {
  public get table() {
    return 'meal_types' as const
  }

  public get serializers() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: MealTypeSerializer<any, any>,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      summary: MealTypeSummarySerializer<any, any>,
    } as const
  }

  public id: DreamColumn<MealType, 'id'>
  public createdAt: DreamColumn<MealType, 'createdAt'>
  public updatedAt: DreamColumn<MealType, 'updatedAt'>
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
import { DreamColumn } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import UserSerializer, { UserSummarySerializer } from '../../../test-app/app/serializers/UserSerializer'

export default class User extends ApplicationModel {
  public get table() {
    return 'users' as const
  }

  public get serializers() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: UserSerializer<any, any>,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      summary: UserSummarySerializer<any, any>,
    } as const
  }

  public id: DreamColumn<User, 'id'>
  public email: DreamColumn<User, 'email'>
  public passwordDigest: DreamColumn<User, 'passwordDigest'>
  public createdAt: DreamColumn<User, 'createdAt'>
  public updatedAt: DreamColumn<User, 'updatedAt'>
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
import { DreamColumn } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import ChalupaSerializer, { ChalupaSummarySerializer } from '../../../test-app/app/serializers/ChalupaSerializer'
import { ToppingEnum, ProteinEnum, MyExistingEnumEnum } from '../../../test-app/db/sync'

export default class Chalupa extends ApplicationModel {
  public get table() {
    return 'chalupas' as const
  }

  public get serializers() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: ChalupaSerializer<any, any>,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      summary: ChalupaSummarySerializer<any, any>,
    } as const
  }

  public id: DreamColumn<Chalupa, 'id'>
  public topping: DreamColumn<Chalupa, 'topping'>
  public protein: DreamColumn<Chalupa, 'protein'>
  public existingEnum: DreamColumn<Chalupa, 'existingEnum'>
  public createdAt: DreamColumn<Chalupa, 'createdAt'>
  public updatedAt: DreamColumn<Chalupa, 'updatedAt'>
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
import { DreamColumn } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import PaperSerializer, { PaperSummarySerializer } from '../../../test-app/app/serializers/PaperSerializer'

export default class Paper extends ApplicationModel {
  public get table() {
    return 'paper' as const
  }

  public get serializers() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: PaperSerializer<any, any>,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      summary: PaperSummarySerializer<any, any>,
    } as const
  }

  public id: DreamColumn<Paper, 'id'>
  public name: DreamColumn<Paper, 'name'>
  public createdAt: DreamColumn<Paper, 'createdAt'>
  public updatedAt: DreamColumn<Paper, 'updatedAt'>
}\
`
        )
      })
    })

    context('relationships', () => {
      context('when provided with a belongsTo relationship', () => {
        it('generates a BelongsTo relationship in model', async () => {
          const res = await generateDreamContent('composition', ['graph_node:belongs_to'])
          expect(res).toEqual(
            `\
import { DreamColumn, BelongsTo } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import CompositionSerializer, { CompositionSummarySerializer } from '../../../test-app/app/serializers/CompositionSerializer'
import GraphNode from './GraphNode'

export default class Composition extends ApplicationModel {
  public get table() {
    return 'compositions' as const
  }

  public get serializers() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: CompositionSerializer<any, any>,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      summary: CompositionSummarySerializer<any, any>,
    } as const
  }

  public id: DreamColumn<Composition, 'id'>
  public createdAt: DreamColumn<Composition, 'createdAt'>
  public updatedAt: DreamColumn<Composition, 'updatedAt'>

  @BelongsTo(() => GraphNode)
  public graphNode: GraphNode
  public graphNodeId: DreamColumn<Composition, 'graphNodeId'>
}\
`
          )
        })

        context('namespaced relationships', () => {
          it('can handle belongs to associations with nested paths', async () => {
            const res = await generateDreamContent('cat_toy', ['pet/domestic/cat:belongs_to'])
            expect(res).toEqual(
              `\
import { DreamColumn, BelongsTo } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import CatToySerializer, { CatToySummarySerializer } from '../../../test-app/app/serializers/CatToySerializer'
import PetDomesticCat from './Pet/Domestic/Cat'

export default class CatToy extends ApplicationModel {
  public get table() {
    return 'cat_toys' as const
  }

  public get serializers() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: CatToySerializer<any, any>,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      summary: CatToySummarySerializer<any, any>,
    } as const
  }

  public id: DreamColumn<CatToy, 'id'>
  public createdAt: DreamColumn<CatToy, 'createdAt'>
  public updatedAt: DreamColumn<CatToy, 'updatedAt'>

  @BelongsTo(() => PetDomesticCat)
  public cat: PetDomesticCat
  public catId: DreamColumn<CatToy, 'catId'>
}\
`
            )
          })

          it('can handle has many associations with nested paths', async () => {
            const res = await generateDreamContent('cat_toy', ['pet/domestic/cat:has_many'])
            expect(res).toEqual(
              `\
import { DreamColumn, HasMany } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import CatToySerializer, { CatToySummarySerializer } from '../../../test-app/app/serializers/CatToySerializer'
import PetDomesticCat from './Pet/Domestic/Cat'

export default class CatToy extends ApplicationModel {
  public get table() {
    return 'cat_toys' as const
  }

  public get serializers() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: CatToySerializer<any, any>,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      summary: CatToySummarySerializer<any, any>,
    } as const
  }

  public id: DreamColumn<CatToy, 'id'>
  public createdAt: DreamColumn<CatToy, 'createdAt'>
  public updatedAt: DreamColumn<CatToy, 'updatedAt'>

  @HasMany(() => PetDomesticCat)
  public cats: PetDomesticCat[]
}\
`
            )
          })

          it('can handle has one associations with nested paths', async () => {
            const res = await generateDreamContent('cat_toy', ['pet/domestic/cat:has_one'])
            expect(res).toEqual(
              `\
import { DreamColumn, HasOne } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import CatToySerializer, { CatToySummarySerializer } from '../../../test-app/app/serializers/CatToySerializer'
import PetDomesticCat from './Pet/Domestic/Cat'

export default class CatToy extends ApplicationModel {
  public get table() {
    return 'cat_toys' as const
  }

  public get serializers() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: CatToySerializer<any, any>,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      summary: CatToySummarySerializer<any, any>,
    } as const
  }

  public id: DreamColumn<CatToy, 'id'>
  public createdAt: DreamColumn<CatToy, 'createdAt'>
  public updatedAt: DreamColumn<CatToy, 'updatedAt'>

  @HasOne(() => PetDomesticCat)
  public cat: PetDomesticCat
}\
`
            )
          })

          it('produces valid association paths when the model being generated is namespaced', async () => {
            const res = await generateDreamContent('pet/domestic/cat', ['graph_node:belongs_to'])
            expect(res).toEqual(
              `\
import { DreamColumn, BelongsTo } from '@rvohealth/dream'
import ApplicationModel from '../../ApplicationModel'
import PetDomesticCatSerializer, { PetDomesticCatSummarySerializer } from '../../../../../test-app/app/serializers/Pet/Domestic/CatSerializer'
import GraphNode from '../../GraphNode'

export default class PetDomesticCat extends ApplicationModel {
  public get table() {
    return 'pet_domestic_cats' as const
  }

  public get serializers() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: PetDomesticCatSerializer<any, any>,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      summary: PetDomesticCatSummarySerializer<any, any>,
    } as const
  }

  public id: DreamColumn<PetDomesticCat, 'id'>
  public createdAt: DreamColumn<PetDomesticCat, 'createdAt'>
  public updatedAt: DreamColumn<PetDomesticCat, 'updatedAt'>

  @BelongsTo(() => GraphNode)
  public graphNode: GraphNode
  public graphNodeId: DreamColumn<PetDomesticCat, 'graphNodeId'>
}\
`
            )
          })

          it('produces valid association paths when both the model being generated and the associated model are namespaced', async () => {
            const res = await generateDreamContent('pet/domestic/cat', ['pet/domestic/dog:belongs_to'])
            expect(res).toEqual(
              `\
import { DreamColumn, BelongsTo } from '@rvohealth/dream'
import ApplicationModel from '../../ApplicationModel'
import PetDomesticCatSerializer, { PetDomesticCatSummarySerializer } from '../../../../../test-app/app/serializers/Pet/Domestic/CatSerializer'
import PetDomesticDog from '../../Pet/Domestic/Dog'

export default class PetDomesticCat extends ApplicationModel {
  public get table() {
    return 'pet_domestic_cats' as const
  }

  public get serializers() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: PetDomesticCatSerializer<any, any>,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      summary: PetDomesticCatSummarySerializer<any, any>,
    } as const
  }

  public id: DreamColumn<PetDomesticCat, 'id'>
  public createdAt: DreamColumn<PetDomesticCat, 'createdAt'>
  public updatedAt: DreamColumn<PetDomesticCat, 'updatedAt'>

  @BelongsTo(() => PetDomesticDog)
  public dog: PetDomesticDog
  public dogId: DreamColumn<PetDomesticCat, 'dogId'>
}\
`
            )
          })

          it('produces valid association paths when both the model being generated and the associated model are namespaced', async () => {
            const res = await generateDreamContent('pet/wild/cat', ['pet/domestic/dog:belongs_to'])
            expect(res).toEqual(
              `\
import { DreamColumn, BelongsTo } from '@rvohealth/dream'
import ApplicationModel from '../../ApplicationModel'
import PetWildCatSerializer, { PetWildCatSummarySerializer } from '../../../../../test-app/app/serializers/Pet/Wild/CatSerializer'
import PetDomesticDog from '../../Pet/Domestic/Dog'

export default class PetWildCat extends ApplicationModel {
  public get table() {
    return 'pet_wild_cats' as const
  }

  public get serializers() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: PetWildCatSerializer<any, any>,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      summary: PetWildCatSummarySerializer<any, any>,
    } as const
  }

  public id: DreamColumn<PetWildCat, 'id'>
  public createdAt: DreamColumn<PetWildCat, 'createdAt'>
  public updatedAt: DreamColumn<PetWildCat, 'updatedAt'>

  @BelongsTo(() => PetDomesticDog)
  public dog: PetDomesticDog
  public dogId: DreamColumn<PetWildCat, 'dogId'>
}\
`
            )
          })
        })

        it('can handle multiple associations without duplicate imports', async () => {
          const res = await generateDreamContent('composition', ['user:belongs_to', 'chalupa:belongs_to'])
          expect(res).toEqual(
            `\
import { DreamColumn, BelongsTo } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import CompositionSerializer, { CompositionSummarySerializer } from '../../../test-app/app/serializers/CompositionSerializer'
import User from './User'
import Chalupa from './Chalupa'

export default class Composition extends ApplicationModel {
  public get table() {
    return 'compositions' as const
  }

  public get serializers() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: CompositionSerializer<any, any>,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      summary: CompositionSummarySerializer<any, any>,
    } as const
  }

  public id: DreamColumn<Composition, 'id'>
  public createdAt: DreamColumn<Composition, 'createdAt'>
  public updatedAt: DreamColumn<Composition, 'updatedAt'>

  @BelongsTo(() => User)
  public user: User
  public userId: DreamColumn<Composition, 'userId'>

  @BelongsTo(() => Chalupa)
  public chalupa: Chalupa
  public chalupaId: DreamColumn<Composition, 'chalupaId'>
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
import { DreamColumn, HasOne } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import CompositionSerializer, { CompositionSummarySerializer } from '../../../test-app/app/serializers/CompositionSerializer'
import User from './User'

export default class Composition extends ApplicationModel {
  public get table() {
    return 'compositions' as const
  }

  public get serializers() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: CompositionSerializer<any, any>,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      summary: CompositionSummarySerializer<any, any>,
    } as const
  }

  public id: DreamColumn<Composition, 'id'>
  public createdAt: DreamColumn<Composition, 'createdAt'>
  public updatedAt: DreamColumn<Composition, 'updatedAt'>

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
import { DreamColumn, HasMany } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import UserSerializer, { UserSummarySerializer } from '../../../test-app/app/serializers/UserSerializer'
import Composition from './Composition'

export default class User extends ApplicationModel {
  public get table() {
    return 'users' as const
  }

  public get serializers() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: UserSerializer<any, any>,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      summary: UserSummarySerializer<any, any>,
    } as const
  }

  public id: DreamColumn<User, 'id'>
  public createdAt: DreamColumn<User, 'createdAt'>
  public updatedAt: DreamColumn<User, 'updatedAt'>

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
import { DreamColumn, BelongsTo } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import CompositionSerializer, { CompositionSummarySerializer } from '../../../test-app/app/serializers/CompositionSerializer'
import User from './User'

export default class Composition extends ApplicationModel {
  public get table() {
    return 'compositions' as const
  }

  public get serializers() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: CompositionSerializer<any, any>,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      summary: CompositionSummarySerializer<any, any>,
    } as const
  }

  public id: DreamColumn<Composition, 'id'>
  public createdAt: DreamColumn<Composition, 'createdAt'>
  public updatedAt: DreamColumn<Composition, 'updatedAt'>

  @BelongsTo(() => User)
  public user: User
  public userId: DreamColumn<Composition, 'userId'>
}\
`
          )
        })
      })
    })
  })
})
