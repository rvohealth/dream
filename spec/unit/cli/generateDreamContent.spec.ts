import generateDreamContent from '../../../src/helpers/cli/generateDreamContent.js'
import { DreamApp } from '../../../src/index.js'

describe('dream generate:model <name> [...attributes]', () => {
  context('when provided with a pascalized model name', () => {
    it('generates a dream model with multiple string fields', () => {
      const res = generateDreamContent({
        fullyQualifiedModelName: 'MealType',
        columnsWithTypes: [],
        serializer: true,
        includeAdminSerializers: false,
      })
      expect(res).toEqual(
        `\
import { Decorators, DreamColumn, DreamSerializers } from '@rvoh/dream'
import ApplicationModel from '@models/ApplicationModel.js'

const deco = new Decorators<typeof MealType>()

export default class MealType extends ApplicationModel {
  public override get table() {
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

  context('serializer: false', () => {
    it('omits the serializer method', () => {
      const res = generateDreamContent({
        fullyQualifiedModelName: 'MealType',
        columnsWithTypes: [],
        serializer: false,
        includeAdminSerializers: false,
      })
      expect(res).toEqual(
        `\
import { Decorators, DreamColumn } from '@rvoh/dream'
import ApplicationModel from '@models/ApplicationModel.js'

const deco = new Decorators<typeof MealType>()

export default class MealType extends ApplicationModel {
  public override get table() {
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

  context('includeAdminSerializers: true', () => {
    it('references the admin and adminSummary serializers', () => {
      const res = generateDreamContent({
        fullyQualifiedModelName: 'MealType',
        columnsWithTypes: [],
        serializer: true,
        includeAdminSerializers: true,
      })
      expect(res).toEqual(
        `\
import { Decorators, DreamColumn, DreamSerializers } from '@rvoh/dream'
import ApplicationModel from '@models/ApplicationModel.js'

const deco = new Decorators<typeof MealType>()

export default class MealType extends ApplicationModel {
  public override get table() {
    return 'meal_types' as const
  }

  public get serializers(): DreamSerializers<MealType> {
    return {
      default: 'MealTypeSerializer',
      summary: 'MealTypeSummarySerializer',
      admin: 'MealTypeAdminSerializer',
      adminSummary: 'MealTypeAdminSummarySerializer',
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

  context('when parentName is included', () => {
    it('extends the parent, adds STI decorator, omits table and base attributes', () => {
      const res = generateDreamContent({
        fullyQualifiedModelName: 'Foo/Bar/Baz',
        columnsWithTypes: ['hello:string'],
        fullyQualifiedParentName: 'Foo/Bar',
        serializer: true,
        includeAdminSerializers: false,
      })
      expect(res).toEqual(
        `\
import { Decorators, DreamColumn, DreamSerializers, STI } from '@rvoh/dream'
import FooBar from '@models/Foo/Bar.js'

const deco = new Decorators<typeof FooBarBaz>()

@STI(FooBar)
export default class FooBarBaz extends FooBar {
  public override get serializers(): DreamSerializers<FooBarBaz> {
    return {
      default: 'Foo/Bar/BazSerializer',
      summary: 'Foo/Bar/BazSummarySerializer',
    }
  }

  public hello: DreamColumn<FooBarBaz, 'hello'>
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
          includeAdminSerializers: false,
        })
        expect(res).toEqual(
          `\
import { Decorators, DreamColumn, DreamSerializers } from '@rvoh/dream'
import ApplicationModel from '@models/ApplicationModel.js'

const deco = new Decorators<typeof User>()

export default class User extends ApplicationModel {
  public override get table() {
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
          includeAdminSerializers: false,
        })
        expect(res).toEqual(
          `\
import { Decorators, DreamColumn, DreamSerializers, Encrypted } from '@rvoh/dream'
import ApplicationModel from '@models/ApplicationModel.js'

const deco = new Decorators<typeof User>()

export default class User extends ApplicationModel {
  public override get table() {
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
          includeAdminSerializers: false,
        })
        expect(res).toEqual(
          `\
import { Decorators, DreamColumn, DreamSerializers } from '@rvoh/dream'
import ApplicationModel from '@models/ApplicationModel.js'

const deco = new Decorators<typeof Chalupa>()

export default class Chalupa extends ApplicationModel {
  public override get table() {
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

      context('with enum[] attributes', () => {
        it('generates a dream model with multiple enum fields', () => {
          const res = generateDreamContent({
            fullyQualifiedModelName: 'chalupa',
            columnsWithTypes: [
              'topping:enum[]:topping:cheese,baja_sauce',
              'protein:enum[]:protein:beef,non_beef',
              'existing_enum:enum[]:my_existing_enum',
            ],
            serializer: true,
            includeAdminSerializers: false,
          })
          expect(res).toEqual(
            `\
import { Decorators, DreamColumn, DreamSerializers } from '@rvoh/dream'
import ApplicationModel from '@models/ApplicationModel.js'

const deco = new Decorators<typeof Chalupa>()

export default class Chalupa extends ApplicationModel {
  public override get table() {
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
    })

    context('when name has an uncountable rule applied in inflections conf', () => {
      it('respects inflections conf while generating model name', () => {
        const res = generateDreamContent({
          fullyQualifiedModelName: 'paper',
          columnsWithTypes: ['name:string'],
          serializer: true,
          includeAdminSerializers: false,
        })
        expect(res).toEqual(
          `\
import { Decorators, DreamColumn, DreamSerializers } from '@rvoh/dream'
import ApplicationModel from '@models/ApplicationModel.js'

const deco = new Decorators<typeof Paper>()

export default class Paper extends ApplicationModel {
  public override get table() {
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

    context('associations', () => {
      context('belongs_to', () => {
        it('generates a BelongsTo relationship in model', () => {
          const res = generateDreamContent({
            fullyQualifiedModelName: 'composition',
            columnsWithTypes: ['graph_node:belongs_to'],
            serializer: true,
            includeAdminSerializers: false,
          })
          expect(res).toEqual(
            `\
import { Decorators, DreamColumn, DreamSerializers } from '@rvoh/dream'
import ApplicationModel from '@models/ApplicationModel.js'
import GraphNode from '@models/GraphNode.js'

const deco = new Decorators<typeof Composition>()

export default class Composition extends ApplicationModel {
  public override get table() {
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

  @deco.BelongsTo('GraphNode', { on: 'graphNodeId' })
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
              includeAdminSerializers: false,
            })
            expect(res).toEqual(
              `\
import { Decorators, DreamColumn, DreamSerializers } from '@rvoh/dream'
import ApplicationModel from '@models/ApplicationModel.js'
import GraphNode from '@models/GraphNode.js'

const deco = new Decorators<typeof Composition>()

export default class Composition extends ApplicationModel {
  public override get table() {
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

  @deco.BelongsTo('GraphNode', { on: 'graphNodeId', optional: true })
  public graphNode: GraphNode | null
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
              includeAdminSerializers: false,
            })
            expect(res).toEqual(
              `\
import { Decorators, DreamColumn, DreamSerializers } from '@rvoh/dream'
import ApplicationModel from '@models/ApplicationModel.js'
import PetDomesticCat from '@models/Pet/Domestic/Cat.js'

const deco = new Decorators<typeof CatToy>()

export default class CatToy extends ApplicationModel {
  public override get table() {
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

  @deco.BelongsTo('Pet/Domestic/Cat', { on: 'catId' })
  public cat: PetDomesticCat
  public catId: DreamColumn<CatToy, 'catId'>
}
`
            )
          })

          it('produces valid association paths when the model being generated is namespaced', () => {
            const res = generateDreamContent({
              fullyQualifiedModelName: 'pet/domestic/cat',
              columnsWithTypes: ['graph_node:belongs_to'],
              serializer: true,
              includeAdminSerializers: false,
            })
            expect(res).toEqual(
              `\
import { Decorators, DreamColumn, DreamSerializers } from '@rvoh/dream'
import ApplicationModel from '@models/ApplicationModel.js'
import GraphNode from '@models/GraphNode.js'

const deco = new Decorators<typeof PetDomesticCat>()

export default class PetDomesticCat extends ApplicationModel {
  public override get table() {
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

  @deco.BelongsTo('GraphNode', { on: 'graphNodeId' })
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
              includeAdminSerializers: false,
            })
            expect(res).toEqual(
              `\
import { Decorators, DreamColumn, DreamSerializers } from '@rvoh/dream'
import ApplicationModel from '@models/ApplicationModel.js'
import PetDomesticDog from '@models/Pet/Domestic/Dog.js'

const deco = new Decorators<typeof PetDomesticCat>()

export default class PetDomesticCat extends ApplicationModel {
  public override get table() {
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

  @deco.BelongsTo('Pet/Domestic/Dog', { on: 'dogId' })
  public dog: PetDomesticDog
  public dogId: DreamColumn<PetDomesticCat, 'dogId'>
}
`
            )
          })

          it('produces valid association paths when both the model being generated and the associated model are namespaced', () => {
            const res = generateDreamContent({
              fullyQualifiedModelName: 'pet/wild/cat',
              columnsWithTypes: ['pet/domestic/dog:belongs_to'],
              serializer: true,
              includeAdminSerializers: false,
            })
            expect(res).toEqual(
              `\
import { Decorators, DreamColumn, DreamSerializers } from '@rvoh/dream'
import ApplicationModel from '@models/ApplicationModel.js'
import PetDomesticDog from '@models/Pet/Domestic/Dog.js'

const deco = new Decorators<typeof PetWildCat>()

export default class PetWildCat extends ApplicationModel {
  public override get table() {
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

  @deco.BelongsTo('Pet/Domestic/Dog', { on: 'dogId' })
  public dog: PetDomesticDog
  public dogId: DreamColumn<PetWildCat, 'dogId'>
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
            includeAdminSerializers: false,
          })
          expect(res).toEqual(
            `\
import { Decorators, DreamColumn, DreamSerializers } from '@rvoh/dream'
import ApplicationModel from '@models/ApplicationModel.js'
import User from '@models/User.js'
import Chalupa from '@models/Chalupa.js'

const deco = new Decorators<typeof Composition>()

export default class Composition extends ApplicationModel {
  public override get table() {
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

  @deco.BelongsTo('User', { on: 'userId' })
  public user: User
  public userId: DreamColumn<Composition, 'userId'>

  @deco.BelongsTo('Chalupa', { on: 'chalupaId' })
  public chalupa: Chalupa
  public chalupaId: DreamColumn<Composition, 'chalupaId'>
}
`
          )
        })
      })

      context('has_one', () => {
        it('is ignored', () => {
          const res = generateDreamContent({
            fullyQualifiedModelName: 'composition',
            columnsWithTypes: ['graph_node:has_one'],
            serializer: true,
            includeAdminSerializers: false,
          })
          expect(res).toEqual(
            `\
import { Decorators, DreamColumn, DreamSerializers } from '@rvoh/dream'
import ApplicationModel from '@models/ApplicationModel.js'

const deco = new Decorators<typeof Composition>()

export default class Composition extends ApplicationModel {
  public override get table() {
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
}
`
          )
        })
      })

      context('has_many', () => {
        it('is ignored', () => {
          const res = generateDreamContent({
            fullyQualifiedModelName: 'composition',
            columnsWithTypes: ['graph_node:has_one'],
            serializer: true,
            includeAdminSerializers: false,
          })
          expect(res).toEqual(
            `\
import { Decorators, DreamColumn, DreamSerializers } from '@rvoh/dream'
import ApplicationModel from '@models/ApplicationModel.js'

const deco = new Decorators<typeof Composition>()

export default class Composition extends ApplicationModel {
  public override get table() {
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
}
`
          )
        })
      })
    })
  })

  context('importExtension is set on DreamApp', () => {
    context('importExtension=.js', () => {
      beforeEach(() => {
        vi.spyOn(DreamApp.prototype, 'importExtension', 'get').mockReturnValue('.js')
      })

      it('styles all imports to have .js suffix', () => {
        const res = generateDreamContent({
          fullyQualifiedModelName: 'composition',
          columnsWithTypes: ['user:belongs_to'],
          serializer: true,
          includeAdminSerializers: false,
        })
        expect(res).toEqual(
          `\
import { Decorators, DreamColumn, DreamSerializers } from '@rvoh/dream'
import ApplicationModel from '@models/ApplicationModel.js'
import User from '@models/User.js'

const deco = new Decorators<typeof Composition>()

export default class Composition extends ApplicationModel {
  public override get table() {
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

  @deco.BelongsTo('User', { on: 'userId' })
  public user: User
  public userId: DreamColumn<Composition, 'userId'>
}
`
        )
      })
    })

    context('importExtension=.ts', () => {
      beforeEach(() => {
        vi.spyOn(DreamApp.prototype, 'importExtension', 'get').mockReturnValue('.ts')
      })

      it('styles all imports to have .ts suffix', () => {
        const res = generateDreamContent({
          fullyQualifiedModelName: 'composition',
          columnsWithTypes: ['user:belongs_to'],
          serializer: true,
          includeAdminSerializers: false,
        })
        expect(res).toEqual(
          `\
import { Decorators, DreamColumn, DreamSerializers } from '@rvoh/dream'
import ApplicationModel from '@models/ApplicationModel.ts'
import User from '@models/User.ts'

const deco = new Decorators<typeof Composition>()

export default class Composition extends ApplicationModel {
  public override get table() {
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

  @deco.BelongsTo('User', { on: 'userId' })
  public user: User
  public userId: DreamColumn<Composition, 'userId'>
}
`
        )
      })
    })

    context('importExtension=none', () => {
      beforeEach(() => {
        vi.spyOn(DreamApp.prototype, 'importExtension', 'get').mockReturnValue('none')
      })

      it('styles all imports to have no suffix', () => {
        const res = generateDreamContent({
          fullyQualifiedModelName: 'composition',
          columnsWithTypes: ['user:belongs_to'],
          serializer: true,
          includeAdminSerializers: false,
        })
        expect(res).toEqual(
          `\
import { Decorators, DreamColumn, DreamSerializers } from '@rvoh/dream'
import ApplicationModel from '@models/ApplicationModel'
import User from '@models/User'

const deco = new Decorators<typeof Composition>()

export default class Composition extends ApplicationModel {
  public override get table() {
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

  @deco.BelongsTo('User', { on: 'userId' })
  public user: User
  public userId: DreamColumn<Composition, 'userId'>
}
`
        )
      })
    })
  })

  context('with an alternate connection provided', () => {
    it('uses the alternate connection name to formulate the base model name', () => {
      const res = generateDreamContent({
        fullyQualifiedModelName: 'composition',
        columnsWithTypes: ['user:belongs_to'],
        serializer: true,
        includeAdminSerializers: false,
        connectionName: 'howyadoin',
      })
      expect(res).toEqual(
        `\
import { Decorators, DreamColumn, DreamSerializers } from '@rvoh/dream'
import HowyadoinApplicationModel from '@models/HowyadoinApplicationModel.js'
import User from '@models/User.js'

const deco = new Decorators<typeof Composition>()

export default class Composition extends HowyadoinApplicationModel {
  public override get table() {
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

  @deco.BelongsTo('User', { on: 'userId' })
  public user: User
  public userId: DreamColumn<Composition, 'userId'>
}
`
      )
    })
  })
})
