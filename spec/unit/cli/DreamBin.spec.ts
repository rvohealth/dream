import DreamBin from '../../../src/bin/index.js'
import type { WriteGeneratedFileArgs } from '../../../src/helpers/cli/writeGeneratedFile.js'
import * as writeGeneratedFileModule from '../../../src/helpers/cli/writeGeneratedFile.js'

let writtenFiles: WriteGeneratedFileArgs[]
let spy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  writtenFiles = []
  spy = vi
    .spyOn(writeGeneratedFileModule, 'default')
    // eslint-disable-next-line @typescript-eslint/require-await
    .mockImplementation(async (args: WriteGeneratedFileArgs) => {
      writtenFiles.push(args)
    })
})

function findWritten(logLabel: string) {
  return writtenFiles.find(w => w.logLabel === logLabel)
}

describe('DreamBin', () => {
  describe('generateDream', () => {
    it('generates model, spec, factory, serializer, and migration files', async () => {
      await DreamBin.generateDream('User', ['email:string', 'name:string'], {
        serializer: true,
        stiBaseSerializer: false,
        connectionName: 'default',
      })

      expect(spy).toHaveBeenCalledTimes(5)

      // Model
      const model = findWritten('dream')!
      expect(model.dreamPathKey).toEqual('models')
      expect(model.fileName).toEqual('User.ts')
      expect(model.content).toContain('export default class User')
      expect(model.content).toContain("public email: DreamColumn<User, 'email'>")
      expect(model.content).toContain("public name: DreamColumn<User, 'name'>")
      expect(model.content).toContain("return 'users' as const")

      // Spec
      const spec = findWritten('spec')!
      expect(spec.dreamPathKey).toEqual('modelSpecs')
      expect(spec.fileName).toEqual('User.spec.ts')
      expect(spec.content).toContain("describe('User'")

      // Factory
      const factory = findWritten('factory')!
      expect(factory.dreamPathKey).toEqual('factories')
      expect(factory.fileName).toEqual('UserFactory.ts')

      // Serializer
      const serializer = findWritten('serializer')!
      expect(serializer.dreamPathKey).toEqual('serializers')
      expect(serializer.fileName).toEqual('UserSerializer.ts')

      // Migration
      const migration = findWritten('migration')!
      expect(migration.basePath).toMatch(/migrations$/)
      expect(migration.content).toContain("createTable('users')")
    })

    it('omits serializer when serializer option is false', async () => {
      await DreamBin.generateDream('User', ['email:string'], {
        serializer: false,
        stiBaseSerializer: false,
        connectionName: 'default',
      })

      expect(spy).toHaveBeenCalledTimes(4)
      expect(findWritten('serializer')).toBeUndefined()
    })

    context('--admin-serializers flag', () => {
      it('generates admin serializer variants when adminSerializers is true', async () => {
        await DreamBin.generateDream('Article', ['title:string'], {
          serializer: true,
          stiBaseSerializer: false,
          connectionName: 'default',
          adminSerializers: true,
        })

        const model = findWritten('dream')!
        expect(model.content).toContain("admin: 'ArticleAdminSerializer'")
        expect(model.content).toContain("adminSummary: 'ArticleAdminSummarySerializer'")

        const serializer = findWritten('serializer')!
        expect(serializer.content).toContain('ArticleAdminSerializer')
        expect(serializer.content).toContain('ArticleAdminSummarySerializer')
      })

      it('does not generate admin serializers when adminSerializers is false', async () => {
        await DreamBin.generateDream('Article', ['title:string'], {
          serializer: true,
          stiBaseSerializer: false,
          connectionName: 'default',
          adminSerializers: false,
        })

        expect(findWritten('dream')!.content).not.toContain('AdminSerializer')
      })

      it('defaults to false when adminSerializers is not provided', async () => {
        await DreamBin.generateDream('Article', ['title:string'], {
          serializer: true,
          stiBaseSerializer: false,
          connectionName: 'default',
        })

        expect(findWritten('dream')!.content).not.toContain('AdminSerializer')
      })
    })

    context('--table-name flag', () => {
      it('uses explicit table name in model and migration', async () => {
        await DreamBin.generateDream('Health/Coach/Certification', ['name:string'], {
          serializer: true,
          stiBaseSerializer: false,
          connectionName: 'default',
          tableName: 'coach_certs',
        })

        expect(findWritten('dream')!.content).toContain("return 'coach_certs' as const")
        expect(findWritten('migration')!.content).toContain("createTable('coach_certs')")
      })
    })

    context('with namespaced models', () => {
      it('generates files with correct paths and class names', async () => {
        await DreamBin.generateDream('Health/Coach', ['name:string'], {
          serializer: true,
          stiBaseSerializer: false,
          connectionName: 'default',
        })

        const model = findWritten('dream')!
        expect(model.fileName).toEqual('Health/Coach.ts')
        expect(model.content).toContain('export default class HealthCoach')
        expect(model.content).toContain("return 'health_coaches' as const")

        expect(findWritten('spec')!.fileName).toEqual('Health/Coach.spec.ts')
        expect(findWritten('factory')!.fileName).toEqual('Health/CoachFactory.ts')
        expect(findWritten('serializer')!.fileName).toEqual('Health/CoachSerializer.ts')
      })
    })

    context('model name standardization', () => {
      it('standardizes lowercase model names', async () => {
        await DreamBin.generateDream('user', ['email:string'], {
          serializer: false,
          stiBaseSerializer: false,
          connectionName: 'default',
        })

        expect(findWritten('dream')!.content).toContain('export default class User')
        expect(findWritten('dream')!.fileName).toEqual('User.ts')
      })

      it('standardizes snake_case model names', async () => {
        await DreamBin.generateDream('meal_type', ['name:string'], {
          serializer: false,
          stiBaseSerializer: false,
          connectionName: 'default',
        })

        expect(findWritten('dream')!.content).toContain('export default class MealType')
        expect(findWritten('dream')!.fileName).toEqual('MealType.ts')
      })
    })

    context('--model-name flag', () => {
      it('uses explicit model name in all generated content', async () => {
        await DreamBin.generateDream('Health/Coach', ['name:string'], {
          serializer: true,
          stiBaseSerializer: false,
          connectionName: 'default',
          modelName: 'Coach',
        })

        // Model class uses the override name
        const model = findWritten('dream')!
        expect(model.content).toContain('export default class Coach extends')
        expect(model.content).toContain("public name: DreamColumn<Coach, 'name'>")
        expect(model.content).toContain("public id: DreamColumn<Coach, 'id'>")
        // File path is still based on fullyQualifiedModelName
        expect(model.fileName).toEqual('Health/Coach.ts')

        // Factory uses override name
        const factory = findWritten('factory')!
        expect(factory.content).toContain('export default async function createCoach')
        expect(factory.content).toContain('Coach.create')

        // Serializer uses override name
        const serializer = findWritten('serializer')!
        expect(serializer.content).toContain('Coach')
      })
    })

    context('with belongs_to associations', () => {
      it('includes BelongsTo decorator and foreign key in model', async () => {
        await DreamBin.generateDream('Post', ['user:belongs_to', 'title:string'], {
          serializer: true,
          stiBaseSerializer: false,
          connectionName: 'default',
        })

        const model = findWritten('dream')!
        expect(model.content).toContain("@deco.BelongsTo('User', { on: 'userId' })")
        expect(model.content).toContain("public userId: DreamColumn<Post, 'userId'>")
      })
    })
  })

  describe('generateStiChild', () => {
    it('generates model, spec, factory, serializer, and migration for an STI child', async () => {
      await DreamBin.generateStiChild('Room/Kitchen', 'Room', ['oven_count:integer'], {
        serializer: true,
        connectionName: 'default',
      })

      expect(spy).toHaveBeenCalledTimes(5)

      // Model extends parent with @STI decorator
      const model = findWritten('dream')!
      expect(model.fileName).toEqual('Room/Kitchen.ts')
      expect(model.content).toContain('export default class RoomKitchen extends Room')
      expect(model.content).toContain('@STI(Room)')

      // Serializer
      expect(findWritten('serializer')).toBeDefined()

      // Migration alters the parent's table
      const migration = findWritten('migration')!
      expect(migration.content).toContain("alterTable('rooms')")
      expect(migration.content).not.toContain('createTable')
    })

    it('skips migration when no columns are provided', async () => {
      await DreamBin.generateStiChild('Room/Kitchen', 'Room', [], {
        serializer: true,
        connectionName: 'default',
      })

      expect(spy).toHaveBeenCalledTimes(4)
      expect(findWritten('migration')).toBeUndefined()
    })

    context('--admin-serializers flag', () => {
      it('generates admin serializer variants for STI child', async () => {
        await DreamBin.generateStiChild('Room/Kitchen', 'Room', ['oven_count:integer'], {
          serializer: true,
          connectionName: 'default',
          adminSerializers: true,
        })

        const model = findWritten('dream')!
        expect(model.content).toContain("admin: 'Room/KitchenAdminSerializer'")
        expect(model.content).toContain("adminSummary: 'Room/KitchenAdminSummarySerializer'")
      })
    })

    context('--model-name flag', () => {
      it('uses explicit model name in STI child content', async () => {
        await DreamBin.generateStiChild('Room/Kitchen', 'Room', ['oven_count:integer'], {
          serializer: true,
          connectionName: 'default',
          modelName: 'Kitchen',
        })

        // Model class uses override name
        const model = findWritten('dream')!
        expect(model.content).toContain('export default class Kitchen extends Room')
        expect(model.content).toContain("public ovenCount: DreamColumn<Kitchen, 'ovenCount'>")

        // Factory uses override name
        const factory = findWritten('factory')!
        expect(factory.content).toContain('createKitchen')

        // Migration uses override name for STI child class
        const migration = findWritten('migration')!
        expect(migration.content).toContain('Kitchen')
      })
    })

    it('always sets stiBaseSerializer to false', async () => {
      await DreamBin.generateStiChild('Room/Kitchen', 'Room', [], {
        serializer: true,
        connectionName: 'default',
      })

      const serializer = findWritten('serializer')!
      expect(serializer.content).not.toContain('StiBaseSerializer')
    })

    it('omits serializer when serializer option is false', async () => {
      await DreamBin.generateStiChild('Room/Kitchen', 'Room', [], {
        serializer: false,
        connectionName: 'default',
      })

      expect(findWritten('serializer')).toBeUndefined()
    })
  })
})
