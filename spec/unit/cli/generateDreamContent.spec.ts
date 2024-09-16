import generateDreamContent from '../../../src/helpers/cli/generateDreamContent'

describe('dream generate:model <name> [...attributes]', () => {
  context('when provided with a pascalized model name', () => {
    it('generates a dream model with multiple string fields', () => {
      const res = generateDreamContent({
        fullyQualifiedModelName: 'MealType',
        columnsWithTypes: [],
        serializer: true,
      })
      expect(res).toEqual(
        `\
import { DreamColumn, DreamSerializers } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'

export default class MealType extends ApplicationModel {
  public get table() {
    return 'meal_types' as const
  }

  public get serializers(): DreamSerializers<MealType> {
    return {
      default: 'MealTypeSerializer',
      summary: 'MealTypeSummarySerializer',
    }
  }

  public id: DreamColumn<MealType, 'id'>
  public createdAt: DreamColumn<MealType, 'createdAt'>
  public updatedAt: DreamColumn<MealType, 'updatedAt'>
}
`
      )
    })
  })

  context('with serializer: false', () => {
    it('omits the serializer method', () => {
      const res = generateDreamContent({
        fullyQualifiedModelName: 'MealType',
        columnsWithTypes: [],
        serializer: false,
      })
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
`
      )
    })
  })

  context('when parentName is included', () => {
    it('extends the parent, adds STI decorator, omits table and base attributes', () => {
      const res = generateDreamContent({
        fullyQualifiedModelName: 'Foo/Bar',
        columnsWithTypes: ['hello:string'],
        fullyQualifiedParentName: 'Foo/Base',
        serializer: true,
      })
      expect(res).toEqual(
        `\
import { DreamColumn, DreamSerializers, STI } from '@rvohealth/dream'
import FooBase from './Base'

@STI(FooBase)
export default class FooBar extends FooBase {
  public get serializers(): DreamSerializers<FooBar> {
    return {
      default: 'Foo/BarSerializer',
      summary: 'Foo/BarSummarySerializer',
    }
  }

  public hello: DreamColumn<FooBar, 'hello'>
}
`
      )
    })
  })

  context('when provided attributes', () => {
    context('with a string attribute', () => {
      it('generates a dream model with multiple string fields', () => {
        const res = generateDreamContent({
          fullyQualifiedModelName: 'user',
          columnsWithTypes: ['email:string', 'password_digest:string'],
          serializer: true,
        })
        expect(res).toEqual(
          `\
import { DreamColumn, DreamSerializers } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'

export default class User extends ApplicationModel {
  public get table() {
    return 'users' as const
  }

  public get serializers(): DreamSerializers<User> {
    return {
      default: 'UserSerializer',
      summary: 'UserSummarySerializer',
    }
  }

  public id: DreamColumn<User, 'id'>
  public email: DreamColumn<User, 'email'>
  public passwordDigest: DreamColumn<User, 'passwordDigest'>
  public createdAt: DreamColumn<User, 'createdAt'>
  public updatedAt: DreamColumn<User, 'updatedAt'>
}
`
        )
      })
    })

    context('with an encrypted attribute', () => {
      it('adds the @Encrypted decorator', () => {
        const res = generateDreamContent({
          fullyQualifiedModelName: 'user',
          columnsWithTypes: ['email:string', 'phone_number:encrypted'],
          serializer: true,
        })
        expect(res).toEqual(
          `\
import { DreamColumn, DreamSerializers, Encrypted } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'

export default class User extends ApplicationModel {
  public get table() {
    return 'users' as const
  }

  public get serializers(): DreamSerializers<User> {
    return {
      default: 'UserSerializer',
      summary: 'UserSummarySerializer',
    }
  }

  public id: DreamColumn<User, 'id'>
  public email: DreamColumn<User, 'email'>
  public createdAt: DreamColumn<User, 'createdAt'>
  public updatedAt: DreamColumn<User, 'updatedAt'>

  @Encrypted()
  public phoneNumber: DreamColumn<User, 'phoneNumber'>
}
`
        )
      })
    })

    context('with enum attributes', () => {
      it('generates a dream model with multiple enum fields', () => {
        const res = generateDreamContent({
          fullyQualifiedModelName: 'chalupa',
          columnsWithTypes: [
            'topping:enum:topping:cheese,baja_sauce',
            'protein:enum:protein:beef,non_beef',
            'existing_enum:enum:my_existing_enum',
          ],
          serializer: true,
        })
        expect(res).toEqual(
          `\
import { DreamColumn, DreamSerializers } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'

export default class Chalupa extends ApplicationModel {
  public get table() {
    return 'chalupas' as const
  }

  public get serializers(): DreamSerializers<Chalupa> {
    return {
      default: 'ChalupaSerializer',
      summary: 'ChalupaSummarySerializer',
    }
  }

  public id: DreamColumn<Chalupa, 'id'>
  public topping: DreamColumn<Chalupa, 'topping'>
  public protein: DreamColumn<Chalupa, 'protein'>
  public existingEnum: DreamColumn<Chalupa, 'existingEnum'>
  public createdAt: DreamColumn<Chalupa, 'createdAt'>
  public updatedAt: DreamColumn<Chalupa, 'updatedAt'>
}
`
        )
      })
    })

    context('when name has an uncountable rule applied in inflections conf', () => {
      it('respects inflections conf while generating model name', () => {
        const res = generateDreamContent({
          fullyQualifiedModelName: 'paper',
          columnsWithTypes: ['name:string'],
          serializer: true,
        })
        expect(res).toEqual(
          `\
import { DreamColumn, DreamSerializers } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'

export default class Paper extends ApplicationModel {
  public get table() {
    return 'paper' as const
  }

  public get serializers(): DreamSerializers<Paper> {
    return {
      default: 'PaperSerializer',
      summary: 'PaperSummarySerializer',
    }
  }

  public id: DreamColumn<Paper, 'id'>
  public name: DreamColumn<Paper, 'name'>
  public createdAt: DreamColumn<Paper, 'createdAt'>
  public updatedAt: DreamColumn<Paper, 'updatedAt'>
}
`
        )
      })
    })

    context('relationships', () => {
      context('when provided with a belongsTo relationship', () => {
        it('generates a BelongsTo relationship in model', () => {
          const res = generateDreamContent({
            fullyQualifiedModelName: 'composition',
            columnsWithTypes: ['graph_node:belongs_to'],
            serializer: true,
          })
          expect(res).toEqual(
            `\
import { DreamColumn, DreamSerializers } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import GraphNode from './GraphNode'

export default class Composition extends ApplicationModel {
  public get table() {
    return 'compositions' as const
  }

  public get serializers(): DreamSerializers<Composition> {
    return {
      default: 'CompositionSerializer',
      summary: 'CompositionSummarySerializer',
    }
  }

  public id: DreamColumn<Composition, 'id'>
  public createdAt: DreamColumn<Composition, 'createdAt'>
  public updatedAt: DreamColumn<Composition, 'updatedAt'>

  @Composition.BelongsTo('GraphNode')
  public graphNode: GraphNode
  public graphNodeId: DreamColumn<Composition, 'graphNodeId'>
}
`
          )
        })

        context('when optional is included', () => {
          it('declares the BelongsTo association optional', () => {
            const res = generateDreamContent({
              fullyQualifiedModelName: 'composition',
              columnsWithTypes: ['graph_node:belongs_to:optional'],
              serializer: true,
            })
            expect(res).toEqual(
              `\
import { DreamColumn, DreamSerializers } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import GraphNode from './GraphNode'

export default class Composition extends ApplicationModel {
  public get table() {
    return 'compositions' as const
  }

  public get serializers(): DreamSerializers<Composition> {
    return {
      default: 'CompositionSerializer',
      summary: 'CompositionSummarySerializer',
    }
  }

  public id: DreamColumn<Composition, 'id'>
  public createdAt: DreamColumn<Composition, 'createdAt'>
  public updatedAt: DreamColumn<Composition, 'updatedAt'>

  @Composition.BelongsTo('GraphNode', { optional: true })
  public graphNode: GraphNode
  public graphNodeId: DreamColumn<Composition, 'graphNodeId'>
}
`
            )
          })
        })

        context('namespaced relationships', () => {
          it('can handle belongs to associations with nested paths', () => {
            const res = generateDreamContent({
              fullyQualifiedModelName: 'cat_toy',
              columnsWithTypes: ['pet/domestic/cat:belongs_to'],
              serializer: true,
            })
            expect(res).toEqual(
              `\
import { DreamColumn, DreamSerializers } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import PetDomesticCat from './Pet/Domestic/Cat'

export default class CatToy extends ApplicationModel {
  public get table() {
    return 'cat_toys' as const
  }

  public get serializers(): DreamSerializers<CatToy> {
    return {
      default: 'CatToySerializer',
      summary: 'CatToySummarySerializer',
    }
  }

  public id: DreamColumn<CatToy, 'id'>
  public createdAt: DreamColumn<CatToy, 'createdAt'>
  public updatedAt: DreamColumn<CatToy, 'updatedAt'>

  @CatToy.BelongsTo('Pet/Domestic/Cat')
  public petDomesticCat: PetDomesticCat
  public petDomesticCatId: DreamColumn<CatToy, 'petDomesticCatId'>
}
`
            )
          })

          it('can handle has many associations with nested paths', () => {
            const res = generateDreamContent({
              fullyQualifiedModelName: 'cat_toy',
              columnsWithTypes: ['pet/domestic/cat:has_many'],
              serializer: true,
            })
            expect(res).toEqual(
              `\
import { DreamColumn, DreamSerializers } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import PetDomesticCat from './Pet/Domestic/Cat'

export default class CatToy extends ApplicationModel {
  public get table() {
    return 'cat_toys' as const
  }

  public get serializers(): DreamSerializers<CatToy> {
    return {
      default: 'CatToySerializer',
      summary: 'CatToySummarySerializer',
    }
  }

  public id: DreamColumn<CatToy, 'id'>
  public createdAt: DreamColumn<CatToy, 'createdAt'>
  public updatedAt: DreamColumn<CatToy, 'updatedAt'>

  @CatToy.HasMany('Pet/Domestic/Cat')
  public petDomesticCats: PetDomesticCat[]
}
`
            )
          })

          it('can handle has one associations with nested paths', () => {
            const res = generateDreamContent({
              fullyQualifiedModelName: 'cat_toy',
              columnsWithTypes: ['pet/domestic/cat:has_one'],
              serializer: true,
            })
            expect(res).toEqual(
              `\
import { DreamColumn, DreamSerializers } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import PetDomesticCat from './Pet/Domestic/Cat'

export default class CatToy extends ApplicationModel {
  public get table() {
    return 'cat_toys' as const
  }

  public get serializers(): DreamSerializers<CatToy> {
    return {
      default: 'CatToySerializer',
      summary: 'CatToySummarySerializer',
    }
  }

  public id: DreamColumn<CatToy, 'id'>
  public createdAt: DreamColumn<CatToy, 'createdAt'>
  public updatedAt: DreamColumn<CatToy, 'updatedAt'>

  @CatToy.HasOne('Pet/Domestic/Cat')
  public petDomesticCat: PetDomesticCat
}
`
            )
          })

          it('produces valid association paths when the model being generated is namespaced', () => {
            const res = generateDreamContent({
              fullyQualifiedModelName: 'pet/domestic/cat',
              columnsWithTypes: ['graph_node:belongs_to'],
              serializer: true,
            })
            expect(res).toEqual(
              `\
import { DreamColumn, DreamSerializers } from '@rvohealth/dream'
import ApplicationModel from '../../ApplicationModel'
import GraphNode from '../../GraphNode'

export default class PetDomesticCat extends ApplicationModel {
  public get table() {
    return 'pet_domestic_cats' as const
  }

  public get serializers(): DreamSerializers<PetDomesticCat> {
    return {
      default: 'Pet/Domestic/CatSerializer',
      summary: 'Pet/Domestic/CatSummarySerializer',
    }
  }

  public id: DreamColumn<PetDomesticCat, 'id'>
  public createdAt: DreamColumn<PetDomesticCat, 'createdAt'>
  public updatedAt: DreamColumn<PetDomesticCat, 'updatedAt'>

  @PetDomesticCat.BelongsTo('GraphNode')
  public graphNode: GraphNode
  public graphNodeId: DreamColumn<PetDomesticCat, 'graphNodeId'>
}
`
            )
          })

          it('produces valid association paths when both the model being generated and the associated model are namespaced', () => {
            const res = generateDreamContent({
              fullyQualifiedModelName: 'pet/domestic/cat',
              columnsWithTypes: ['pet/domestic/dog:belongs_to'],
              serializer: true,
            })
            expect(res).toEqual(
              `\
import { DreamColumn, DreamSerializers } from '@rvohealth/dream'
import ApplicationModel from '../../ApplicationModel'
import PetDomesticDog from './Dog'

export default class PetDomesticCat extends ApplicationModel {
  public get table() {
    return 'pet_domestic_cats' as const
  }

  public get serializers(): DreamSerializers<PetDomesticCat> {
    return {
      default: 'Pet/Domestic/CatSerializer',
      summary: 'Pet/Domestic/CatSummarySerializer',
    }
  }

  public id: DreamColumn<PetDomesticCat, 'id'>
  public createdAt: DreamColumn<PetDomesticCat, 'createdAt'>
  public updatedAt: DreamColumn<PetDomesticCat, 'updatedAt'>

  @PetDomesticCat.BelongsTo('Pet/Domestic/Dog')
  public petDomesticDog: PetDomesticDog
  public petDomesticDogId: DreamColumn<PetDomesticCat, 'petDomesticDogId'>
}
`
            )
          })

          it('produces valid association paths when both the model being generated and the associated model are namespaced', () => {
            const res = generateDreamContent({
              fullyQualifiedModelName: 'pet/wild/cat',
              columnsWithTypes: ['pet/domestic/dog:belongs_to'],
              serializer: true,
            })
            expect(res).toEqual(
              `\
import { DreamColumn, DreamSerializers } from '@rvohealth/dream'
import ApplicationModel from '../../ApplicationModel'
import PetDomesticDog from '../Domestic/Dog'

export default class PetWildCat extends ApplicationModel {
  public get table() {
    return 'pet_wild_cats' as const
  }

  public get serializers(): DreamSerializers<PetWildCat> {
    return {
      default: 'Pet/Wild/CatSerializer',
      summary: 'Pet/Wild/CatSummarySerializer',
    }
  }

  public id: DreamColumn<PetWildCat, 'id'>
  public createdAt: DreamColumn<PetWildCat, 'createdAt'>
  public updatedAt: DreamColumn<PetWildCat, 'updatedAt'>

  @PetWildCat.BelongsTo('Pet/Domestic/Dog')
  public petDomesticDog: PetDomesticDog
  public petDomesticDogId: DreamColumn<PetWildCat, 'petDomesticDogId'>
}
`
            )
          })
        })

        it('can handle multiple associations without duplicate imports', () => {
          const res = generateDreamContent({
            fullyQualifiedModelName: 'composition',
            columnsWithTypes: ['user:belongs_to', 'chalupa:belongs_to'],
            serializer: true,
          })
          expect(res).toEqual(
            `\
import { DreamColumn, DreamSerializers } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import User from './User'
import Chalupa from './Chalupa'

export default class Composition extends ApplicationModel {
  public get table() {
    return 'compositions' as const
  }

  public get serializers(): DreamSerializers<Composition> {
    return {
      default: 'CompositionSerializer',
      summary: 'CompositionSummarySerializer',
    }
  }

  public id: DreamColumn<Composition, 'id'>
  public createdAt: DreamColumn<Composition, 'createdAt'>
  public updatedAt: DreamColumn<Composition, 'updatedAt'>

  @Composition.BelongsTo('User')
  public user: User
  public userId: DreamColumn<Composition, 'userId'>

  @Composition.BelongsTo('Chalupa')
  public chalupa: Chalupa
  public chalupaId: DreamColumn<Composition, 'chalupaId'>
}
`
          )
        })
      })

      context('when provided with a hasOne relationship', () => {
        it('generates a HasOne relationship in model', () => {
          const res = generateDreamContent({
            fullyQualifiedModelName: 'composition',
            columnsWithTypes: ['user:has_one'],
            serializer: true,
          })
          expect(res).toEqual(
            `\
import { DreamColumn, DreamSerializers } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import User from './User'

export default class Composition extends ApplicationModel {
  public get table() {
    return 'compositions' as const
  }

  public get serializers(): DreamSerializers<Composition> {
    return {
      default: 'CompositionSerializer',
      summary: 'CompositionSummarySerializer',
    }
  }

  public id: DreamColumn<Composition, 'id'>
  public createdAt: DreamColumn<Composition, 'createdAt'>
  public updatedAt: DreamColumn<Composition, 'updatedAt'>

  @Composition.HasOne('User')
  public user: User
}
`
          )
        })
      })

      context('when provided with a hasMany relationship', () => {
        it('generates a HasMany relationship in model', () => {
          const res = generateDreamContent({
            fullyQualifiedModelName: 'user',
            columnsWithTypes: ['composition:has_many'],
            serializer: true,
          })
          expect(res).toEqual(
            `\
import { DreamColumn, DreamSerializers } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import Composition from './Composition'

export default class User extends ApplicationModel {
  public get table() {
    return 'users' as const
  }

  public get serializers(): DreamSerializers<User> {
    return {
      default: 'UserSerializer',
      summary: 'UserSummarySerializer',
    }
  }

  public id: DreamColumn<User, 'id'>
  public createdAt: DreamColumn<User, 'createdAt'>
  public updatedAt: DreamColumn<User, 'updatedAt'>

  @User.HasMany('Composition')
  public compositions: Composition[]
}
`
          )
        })
      })

      context('when provided with a relationship and using uuids', () => {
        it('generates a uuid id field for relations relationship in model', () => {
          const res = generateDreamContent({
            fullyQualifiedModelName: 'composition',
            columnsWithTypes: ['user:belongs_to'],
            serializer: true,
          })
          expect(res).toEqual(
            `\
import { DreamColumn, DreamSerializers } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import User from './User'

export default class Composition extends ApplicationModel {
  public get table() {
    return 'compositions' as const
  }

  public get serializers(): DreamSerializers<Composition> {
    return {
      default: 'CompositionSerializer',
      summary: 'CompositionSummarySerializer',
    }
  }

  public id: DreamColumn<Composition, 'id'>
  public createdAt: DreamColumn<Composition, 'createdAt'>
  public updatedAt: DreamColumn<Composition, 'updatedAt'>

  @Composition.BelongsTo('User')
  public user: User
  public userId: DreamColumn<Composition, 'userId'>
}
`
          )
        })
      })
    })
  })
})
