import DreamApp from '../../../src/dream-app/index.js'
import generateDreamContent, {
  createBelongsToAttribute,
  createEncryptedAttribute,
  createImportConfig,
  createModelConfig,
  createRegularAttribute,
  processAttribute,
  processAttributes,
  type ModelConfig,
} from '../../../src/helpers/cli/generateDreamContent.js'

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
import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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
import { Decorators } from '@rvoh/dream'
import { DreamColumn } from '@rvoh/dream/types'
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
import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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
import { Decorators, STI } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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
import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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
import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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

  @deco.Encrypted()
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
import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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
import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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
import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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
import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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

        context('with belongsTo camelized instead of snake_cased', () => {
          it('generates a BelongsTo relationship in model', () => {
            const res = generateDreamContent({
              fullyQualifiedModelName: 'composition',
              columnsWithTypes: ['graph_node:belongsTo'],
              serializer: true,
              includeAdminSerializers: false,
            })
            expect(res).toEqual(
              `\
import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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
import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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
import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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
import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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
import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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
import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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
import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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
import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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
import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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
import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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
import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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
import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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
import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
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

describe('Individual Function Tests', () => {
  describe('createModelConfig', () => {
    it('creates correct model config for simple model', () => {
      const options = {
        fullyQualifiedModelName: 'User',
        columnsWithTypes: [],
        serializer: true,
        includeAdminSerializers: false,
      }

      const config = createModelConfig(options)

      expect(config).toEqual({
        fullyQualifiedModelName: 'User',
        modelClassName: 'User',
        parentModelClassName: undefined,
        applicationModelName: 'ApplicationModel',
        isSTI: false,
        tableName: 'users',
      })
    })

    it('creates correct model config for STI model', () => {
      const options = {
        fullyQualifiedModelName: 'Foo/Bar/Baz',
        columnsWithTypes: [],
        fullyQualifiedParentName: 'Foo/Bar',
        serializer: true,
        includeAdminSerializers: false,
      }

      const config = createModelConfig(options)

      expect(config).toEqual({
        fullyQualifiedModelName: 'Foo/Bar/Baz',
        modelClassName: 'FooBarBaz',
        parentModelClassName: 'FooBar',
        applicationModelName: 'ApplicationModel',
        isSTI: true,
        tableName: 'foo_bar_bazs',
      })
    })

    it('creates correct model config with custom connection', () => {
      const options = {
        fullyQualifiedModelName: 'User',
        columnsWithTypes: [],
        connectionName: 'secondary',
        serializer: true,
        includeAdminSerializers: false,
      }

      const config = createModelConfig(options)

      expect(config.applicationModelName).toEqual('SecondaryApplicationModel')
    })

    it('handles namespaced model names correctly', () => {
      const options = {
        fullyQualifiedModelName: 'admin/user',
        columnsWithTypes: [],
        serializer: true,
        includeAdminSerializers: false,
      }

      const config = createModelConfig(options)

      expect(config).toEqual({
        fullyQualifiedModelName: 'Admin/User',
        modelClassName: 'AdminUser',
        parentModelClassName: undefined,
        applicationModelName: 'ApplicationModel',
        isSTI: false,
        tableName: 'admin_users',
      })
    })
  })

  describe('createImportConfig', () => {
    it('creates basic import config for non-STI model with serializer', () => {
      const config: ModelConfig = {
        fullyQualifiedModelName: 'User',
        modelClassName: 'User',
        parentModelClassName: undefined,
        applicationModelName: 'ApplicationModel',
        isSTI: false,
        tableName: 'users',
      }

      const options = {
        fullyQualifiedModelName: 'User',
        columnsWithTypes: [],
        serializer: true,
        includeAdminSerializers: false,
      }

      const imports = createImportConfig(config, options)

      expect(imports.dreamTypeImports).toEqual(['DreamColumn', 'DreamSerializers'])
      expect(imports.dreamImports).toEqual(['Decorators'])
      expect(imports.modelImportStatements).toHaveLength(1)
    })

    it('creates import config for STI model', () => {
      const config: ModelConfig = {
        fullyQualifiedModelName: 'Foo/Bar/Baz',
        modelClassName: 'FooBarBaz',
        parentModelClassName: 'FooBar',
        applicationModelName: 'ApplicationModel',
        isSTI: true,
        tableName: 'foo_bar_bazs',
      }

      const options = {
        fullyQualifiedModelName: 'Foo/Bar/Baz',
        columnsWithTypes: [],
        fullyQualifiedParentName: 'Foo/Bar',
        serializer: true,
        includeAdminSerializers: false,
      }

      const imports = createImportConfig(config, options)

      expect(imports.dreamImports).toContain('STI')
      expect(imports.dreamImports).toContain('Decorators')
    })

    it('excludes DreamSerializers when serializer is false', () => {
      const config: ModelConfig = {
        fullyQualifiedModelName: 'User',
        modelClassName: 'User',
        parentModelClassName: undefined,
        applicationModelName: 'ApplicationModel',
        isSTI: false,
        tableName: 'users',
      }

      const options = {
        fullyQualifiedModelName: 'User',
        columnsWithTypes: [],
        serializer: false,
        includeAdminSerializers: false,
      }

      const imports = createImportConfig(config, options)

      expect(imports.dreamTypeImports).toEqual(['DreamColumn'])
      expect(imports.dreamTypeImports).not.toContain('DreamSerializers')
    })
  })

  describe('processAttribute', () => {
    it('processes string attribute correctly', () => {
      const result = processAttribute('name:string', 'User')

      expect(result.content).toEqual(`
public name: DreamColumn<User, 'name'>`)
      expect(result.imports).toEqual([])
    })

    it('processes encrypted attribute correctly', () => {
      const result = processAttribute('ssn:encrypted', 'User')

      expect(result.content).toEqual(`
@deco.Encrypted()
public ssn: DreamColumn<User, 'ssn'>`)
      expect(result.imports).toEqual([])
    })

    it('processes belongs_to attribute correctly', () => {
      const result = processAttribute('company:belongs_to', 'User')

      expect(result.content).toContain("@deco.BelongsTo('Company', { on: 'companyId' })")
      expect(result.content).toContain('public company: Company')
      expect(result.content).toContain("public companyId: DreamColumn<User, 'companyId'>")
      expect(result.imports).toHaveLength(1)
    })

    it('processes optional belongs_to attribute correctly', () => {
      const result = processAttribute('company:belongs_to:optional', 'User')

      expect(result.content).toContain("@deco.BelongsTo('Company', { on: 'companyId', optional: true })")
      expect(result.content).toContain('public company: Company | null')
    })

    it('ignores has_one and has_many attributes', () => {
      expect(processAttribute('posts:has_many', 'User')).toEqual({ content: '', imports: [] })
      expect(processAttribute('posts:hasMany', 'User')).toEqual({ content: '', imports: [] })
      expect(processAttribute('profile:has_one', 'User')).toEqual({ content: '', imports: [] })
      expect(processAttribute('profile:hasOne', 'User')).toEqual({ content: '', imports: [] })
    })

    it('throws error when attribute type is missing', () => {
      expect(() => {
        processAttribute('name', 'User')
      }).toThrow('must pass a column type for name (i.e. name:string)')
    })

    it('returns empty string for undefined attribute name', () => {
      const result = processAttribute(':string', 'User')
      expect(result.content).toEqual(`
public : DreamColumn<User, ''>`)
      expect(result.imports).toEqual([])
    })

    it('returns empty string for completely empty attribute', () => {
      expect(() => {
        processAttribute('', 'User')
      }).toThrow('must pass a column type for  (i.e. :string)')
    })
  })

  describe('createBelongsToAttribute', () => {
    it('creates basic belongs_to attribute', () => {
      const result = createBelongsToAttribute('company', [], 'User')

      expect(result.content).toEqual(`
@deco.BelongsTo('Company', { on: 'companyId' })
public company: Company
public companyId: DreamColumn<User, 'companyId'>
`)
      expect(result.imports).toHaveLength(1)
    })

    it('creates optional belongs_to attribute', () => {
      const result = createBelongsToAttribute('company', ['optional'], 'User')

      expect(result.content).toContain('optional: true')
      expect(result.content).toContain('public company: Company | null')
    })

    it('handles namespaced association names', () => {
      const result = createBelongsToAttribute('admin/company', [], 'User')

      expect(result.content).toContain("@deco.BelongsTo('Admin/Company', { on: 'companyId' })")
      expect(result.content).toContain('public company: AdminCompany')
      expect(result.content).toContain("public companyId: DreamColumn<User, 'companyId'>")
    })
  })

  describe('createEncryptedAttribute', () => {
    it('creates encrypted attribute with decorator', () => {
      const result = createEncryptedAttribute('ssn', 'ssn:encrypted', 'User')

      expect(result.content).toEqual(`
@deco.Encrypted()
public ssn: DreamColumn<User, 'ssn'>`)
      expect(result.imports).toEqual([])
    })

    it('handles snake_case attribute names', () => {
      const result = createEncryptedAttribute(
        'social_security_number',
        'social_security_number:encrypted',
        'User'
      )

      expect(result.content).toContain(
        "public socialSecurityNumber: DreamColumn<User, 'socialSecurityNumber'>"
      )
    })
  })

  describe('createRegularAttribute', () => {
    it('creates regular attribute without decorators', () => {
      const result = createRegularAttribute('name', 'name:string', 'User')

      expect(result.content).toEqual(`
public name: DreamColumn<User, 'name'>`)
      expect(result.imports).toEqual([])
    })

    it('handles snake_case attribute names', () => {
      const result = createRegularAttribute('first_name', 'first_name:string', 'User')

      expect(result.content).toContain("public firstName: DreamColumn<User, 'firstName'>")
    })
  })

  describe('processAttributes', () => {
    it('separates fields and decorators correctly', () => {
      const attributes = ['name:string', 'ssn:encrypted', 'company:belongs_to']

      const result = processAttributes(attributes, 'User')

      expect(result.formattedFields).toContain("public name: DreamColumn<User, 'name'>")
      expect(result.formattedDecorators).toContain('@deco.Encrypted()')
      expect(result.formattedDecorators).toContain('@deco.BelongsTo(')
    })

    it('handles empty attributes array', () => {
      const result = processAttributes([], 'User')

      expect(result.formattedFields).toEqual('')
      expect(result.formattedDecorators).toEqual('')
    })
  })
})
