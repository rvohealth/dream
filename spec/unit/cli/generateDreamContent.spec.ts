import generateDreamContent from '../../../src/helpers/cli/generateDreamContent'

describe('dream generate:model <name> [...attributes]', () => {
  context('when provided with a pascalized model name', () => {
    it('generates a dream model with multiple string fields', () => {
      const res = generateDreamContent('MealType', [])
      expect(res).toEqual(
        `\
import { DreamColumn } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'

export default class MealType extends ApplicationModel {
  public get table() {
    return 'meal_types' as const
  }

  public id: DreamColumn<MealType, 'id'>
  public createdAt: DreamColumn<MealType, 'createdAt'>
  public updatedAt: DreamColumn<MealType, 'updatedAt'>
}

MealType.register('serializers', {
  default: 'MealTypeSerializer',
  summary: 'MealTypeSummarySerializer',
})`
      )
    })
  })

  context('when provided attributes', () => {
    context('with a string attribute', () => {
      it('generates a dream model with multiple string fields', () => {
        const res = generateDreamContent('user', ['email:string', 'password_digest:string'])
        expect(res).toEqual(
          `\
import { DreamColumn } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'

export default class User extends ApplicationModel {
  public get table() {
    return 'users' as const
  }

  public id: DreamColumn<User, 'id'>
  public email: DreamColumn<User, 'email'>
  public passwordDigest: DreamColumn<User, 'passwordDigest'>
  public createdAt: DreamColumn<User, 'createdAt'>
  public updatedAt: DreamColumn<User, 'updatedAt'>
}

User.register('serializers', {
  default: 'UserSerializer',
  summary: 'UserSummarySerializer',
})`
        )
      })
    })

    context('with enum attributes', () => {
      it('generates a dream model with multiple enum fields', () => {
        const res = generateDreamContent('chalupa', [
          'topping:enum:topping:cheese,baja_sauce',
          'protein:enum:protein:beef,non_beef',
          'existing_enum:enum:my_existing_enum',
        ])
        expect(res).toEqual(
          `\
import { DreamColumn } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'

export default class Chalupa extends ApplicationModel {
  public get table() {
    return 'chalupas' as const
  }

  public id: DreamColumn<Chalupa, 'id'>
  public topping: DreamColumn<Chalupa, 'topping'>
  public protein: DreamColumn<Chalupa, 'protein'>
  public existingEnum: DreamColumn<Chalupa, 'existingEnum'>
  public createdAt: DreamColumn<Chalupa, 'createdAt'>
  public updatedAt: DreamColumn<Chalupa, 'updatedAt'>
}

Chalupa.register('serializers', {
  default: 'ChalupaSerializer',
  summary: 'ChalupaSummarySerializer',
})`
        )
      })
    })

    context('when name has an uncountable rule applied in inflections conf', () => {
      it('respects inflections conf while generating model name', () => {
        const res = generateDreamContent('paper', ['name:string'])
        expect(res).toEqual(
          `\
import { DreamColumn } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'

export default class Paper extends ApplicationModel {
  public get table() {
    return 'paper' as const
  }

  public id: DreamColumn<Paper, 'id'>
  public name: DreamColumn<Paper, 'name'>
  public createdAt: DreamColumn<Paper, 'createdAt'>
  public updatedAt: DreamColumn<Paper, 'updatedAt'>
}

Paper.register('serializers', {
  default: 'PaperSerializer',
  summary: 'PaperSummarySerializer',
})`
        )
      })
    })

    context('relationships', () => {
      context('when provided with a belongsTo relationship', () => {
        it('generates a BelongsTo relationship in model', () => {
          const res = generateDreamContent('composition', ['graph_node:belongs_to'])
          expect(res).toEqual(
            `\
import { DreamColumn, BelongsTo } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import GraphNode from './GraphNode'

export default class Composition extends ApplicationModel {
  public get table() {
    return 'compositions' as const
  }

  public id: DreamColumn<Composition, 'id'>
  public createdAt: DreamColumn<Composition, 'createdAt'>
  public updatedAt: DreamColumn<Composition, 'updatedAt'>

  @BelongsTo(() => GraphNode)
  public graphNode: GraphNode
  public graphNodeId: DreamColumn<Composition, 'graphNodeId'>
}

Composition.register('serializers', {
  default: 'CompositionSerializer',
  summary: 'CompositionSummarySerializer',
})`
          )
        })

        context('namespaced relationships', () => {
          it('can handle belongs to associations with nested paths', () => {
            const res = generateDreamContent('cat_toy', ['pet/domestic/cat:belongs_to'])
            expect(res).toEqual(
              `\
import { DreamColumn, BelongsTo } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import Cat from './Pet/Domestic/Cat'

export default class CatToy extends ApplicationModel {
  public get table() {
    return 'cat_toys' as const
  }

  public id: DreamColumn<CatToy, 'id'>
  public createdAt: DreamColumn<CatToy, 'createdAt'>
  public updatedAt: DreamColumn<CatToy, 'updatedAt'>

  @BelongsTo(() => Cat)
  public cat: Cat
  public catId: DreamColumn<CatToy, 'catId'>
}

CatToy.register('serializers', {
  default: 'CatToySerializer',
  summary: 'CatToySummarySerializer',
})`
            )
          })

          it('can handle has many associations with nested paths', () => {
            const res = generateDreamContent('cat_toy', ['pet/domestic/cat:has_many'])
            expect(res).toEqual(
              `\
import { DreamColumn, HasMany } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import Cat from './Pet/Domestic/Cat'

export default class CatToy extends ApplicationModel {
  public get table() {
    return 'cat_toys' as const
  }

  public id: DreamColumn<CatToy, 'id'>
  public createdAt: DreamColumn<CatToy, 'createdAt'>
  public updatedAt: DreamColumn<CatToy, 'updatedAt'>

  @HasMany(() => Cat)
  public cats: Cat[]
}

CatToy.register('serializers', {
  default: 'CatToySerializer',
  summary: 'CatToySummarySerializer',
})`
            )
          })

          it('can handle has one associations with nested paths', () => {
            const res = generateDreamContent('cat_toy', ['pet/domestic/cat:has_one'])
            expect(res).toEqual(
              `\
import { DreamColumn, HasOne } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import Cat from './Pet/Domestic/Cat'

export default class CatToy extends ApplicationModel {
  public get table() {
    return 'cat_toys' as const
  }

  public id: DreamColumn<CatToy, 'id'>
  public createdAt: DreamColumn<CatToy, 'createdAt'>
  public updatedAt: DreamColumn<CatToy, 'updatedAt'>

  @HasOne(() => Cat)
  public cat: Cat
}

CatToy.register('serializers', {
  default: 'CatToySerializer',
  summary: 'CatToySummarySerializer',
})`
            )
          })

          it('produces valid association paths when the model being generated is namespaced', () => {
            const res = generateDreamContent('pet/domestic/cat', ['graph_node:belongs_to'])
            expect(res).toEqual(
              `\
import { DreamColumn, BelongsTo } from '@rvohealth/dream'
import ApplicationModel from '../../ApplicationModel'
import GraphNode from '../../GraphNode'

export default class Cat extends ApplicationModel {
  public get table() {
    return 'pet_domestic_cats' as const
  }

  public id: DreamColumn<Cat, 'id'>
  public createdAt: DreamColumn<Cat, 'createdAt'>
  public updatedAt: DreamColumn<Cat, 'updatedAt'>

  @BelongsTo(() => GraphNode)
  public graphNode: GraphNode
  public graphNodeId: DreamColumn<Cat, 'graphNodeId'>
}

Cat.register('serializers', {
  default: 'PetDomesticCatSerializer',
  summary: 'PetDomesticCatSummarySerializer',
})`
            )
          })

          it('produces valid association paths when both the model being generated and the associated model are namespaced', () => {
            const res = generateDreamContent('pet/domestic/cat', ['pet/domestic/dog:belongs_to'])
            expect(res).toEqual(
              `\
import { DreamColumn, BelongsTo } from '@rvohealth/dream'
import ApplicationModel from '../../ApplicationModel'
import Dog from '../../Pet/Domestic/Dog'

export default class Cat extends ApplicationModel {
  public get table() {
    return 'pet_domestic_cats' as const
  }

  public id: DreamColumn<Cat, 'id'>
  public createdAt: DreamColumn<Cat, 'createdAt'>
  public updatedAt: DreamColumn<Cat, 'updatedAt'>

  @BelongsTo(() => Dog)
  public dog: Dog
  public dogId: DreamColumn<Cat, 'dogId'>
}

Cat.register('serializers', {
  default: 'PetDomesticCatSerializer',
  summary: 'PetDomesticCatSummarySerializer',
})`
            )
          })

          it('produces valid association paths when both the model being generated and the associated model are namespaced', () => {
            const res = generateDreamContent('pet/wild/cat', ['pet/domestic/dog:belongs_to'])
            expect(res).toEqual(
              `\
import { DreamColumn, BelongsTo } from '@rvohealth/dream'
import ApplicationModel from '../../ApplicationModel'
import Dog from '../../Pet/Domestic/Dog'

export default class Cat extends ApplicationModel {
  public get table() {
    return 'pet_wild_cats' as const
  }

  public id: DreamColumn<Cat, 'id'>
  public createdAt: DreamColumn<Cat, 'createdAt'>
  public updatedAt: DreamColumn<Cat, 'updatedAt'>

  @BelongsTo(() => Dog)
  public dog: Dog
  public dogId: DreamColumn<Cat, 'dogId'>
}

Cat.register('serializers', {
  default: 'PetWildCatSerializer',
  summary: 'PetWildCatSummarySerializer',
})`
            )
          })
        })

        it('can handle multiple associations without duplicate imports', () => {
          const res = generateDreamContent('composition', ['user:belongs_to', 'chalupa:belongs_to'])
          expect(res).toEqual(
            `\
import { DreamColumn, BelongsTo } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import User from './User'
import Chalupa from './Chalupa'

export default class Composition extends ApplicationModel {
  public get table() {
    return 'compositions' as const
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
}

Composition.register('serializers', {
  default: 'CompositionSerializer',
  summary: 'CompositionSummarySerializer',
})`
          )
        })
      })

      context('when provided with a hasOne relationship', () => {
        it('generates a HasOne relationship in model', () => {
          const res = generateDreamContent('composition', ['user:has_one'])
          expect(res).toEqual(
            `\
import { DreamColumn, HasOne } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import User from './User'

export default class Composition extends ApplicationModel {
  public get table() {
    return 'compositions' as const
  }

  public id: DreamColumn<Composition, 'id'>
  public createdAt: DreamColumn<Composition, 'createdAt'>
  public updatedAt: DreamColumn<Composition, 'updatedAt'>

  @HasOne(() => User)
  public user: User
}

Composition.register('serializers', {
  default: 'CompositionSerializer',
  summary: 'CompositionSummarySerializer',
})`
          )
        })
      })

      context('when provided with a hasMany relationship', () => {
        it('generates a HasMany relationship in model', () => {
          const res = generateDreamContent('user', ['composition:has_many'])
          expect(res).toEqual(
            `\
import { DreamColumn, HasMany } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import Composition from './Composition'

export default class User extends ApplicationModel {
  public get table() {
    return 'users' as const
  }

  public id: DreamColumn<User, 'id'>
  public createdAt: DreamColumn<User, 'createdAt'>
  public updatedAt: DreamColumn<User, 'updatedAt'>

  @HasMany(() => Composition)
  public compositions: Composition[]
}

User.register('serializers', {
  default: 'UserSerializer',
  summary: 'UserSummarySerializer',
})`
          )
        })
      })

      context('when provided with a relationship and using uuids', () => {
        it('generates a uuid id field for relations relationship in model', () => {
          const res = generateDreamContent('composition', ['user:belongs_to'])
          expect(res).toEqual(
            `\
import { DreamColumn, BelongsTo } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import User from './User'

export default class Composition extends ApplicationModel {
  public get table() {
    return 'compositions' as const
  }

  public id: DreamColumn<Composition, 'id'>
  public createdAt: DreamColumn<Composition, 'createdAt'>
  public updatedAt: DreamColumn<Composition, 'updatedAt'>

  @BelongsTo(() => User)
  public user: User
  public userId: DreamColumn<Composition, 'userId'>
}

Composition.register('serializers', {
  default: 'CompositionSerializer',
  summary: 'CompositionSummarySerializer',
})`
          )
        })
      })
    })
  })
})
