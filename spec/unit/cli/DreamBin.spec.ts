import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import DreamBin from '../../../src/bin/index.js'
import DreamCLI from '../../../src/cli/index.js'
import DreamApp from '../../../src/dream-app/index.js'
import InvalidMigrationTableName from '../../../src/errors/InvalidMigrationTableName.js'
import type { WriteGeneratedFileArgs } from '../../../src/helpers/cli/writeGeneratedFile.js'
import * as writeGeneratedFileModule from '../../../src/helpers/cli/writeGeneratedFile.js'

let writtenFiles: WriteGeneratedFileArgs[]
let spy: ReturnType<typeof vi.spyOn>
let projectRoot: string

// The app's dream paths (test-app/app/models, ...) resolve under this empty
// temporary project root, so the generator never sees or touches test-app's
// own files: test-app already has a User model.
beforeEach(async () => {
  projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'dream-bin-spec-'))
  vi.spyOn(DreamApp.getOrFail(), 'projectRoot', 'get').mockReturnValue(projectRoot)
  vi.spyOn(DreamCLI.logger, 'log').mockImplementation(() => {})

  writtenFiles = []
  spy = vi
    .spyOn(writeGeneratedFileModule, 'default')
    // eslint-disable-next-line @typescript-eslint/require-await
    .mockImplementation(async (args: WriteGeneratedFileArgs) => {
      writtenFiles.push(args)
    })
})

afterEach(async () => {
  await fs.rm(projectRoot, { recursive: true, force: true })
})

function findWritten(logLabel: string) {
  return writtenFiles.find(w => w.logLabel === logLabel)
}

async function writeProjectFile(relPath: string, content: string) {
  const absPath = path.join(projectRoot, relPath)
  await fs.mkdir(path.dirname(absPath), { recursive: true })
  await fs.writeFile(absPath, content)
}

async function readProjectFile(relPath: string) {
  return await fs.readFile(path.join(projectRoot, relPath), 'utf8')
}

async function projectFiles() {
  const entries = await fs.readdir(projectRoot, { recursive: true, withFileTypes: true })
  return entries
    .filter(entry => entry.isFile())
    .map(entry => path.relative(projectRoot, path.join(entry.parentPath, entry.name)))
    .sort()
}

async function rejectionOf(promise: Promise<unknown>) {
  try {
    await promise
  } catch (error) {
    return error as Error
  }
  throw new Error('expected the generator to throw, but it resolved')
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

      it('rejects a table name that is not a plain identifier before writing any file', async () => {
        await expect(
          DreamBin.generateDream('Health/Coach/Certification', ['name:string'], {
            serializer: true,
            stiBaseSerializer: false,
            connectionName: 'default',
            tableName: "coach_certs'); drop table users; --",
          })
        ).rejects.toThrow(InvalidMigrationTableName)

        expect(spy).not.toHaveBeenCalled()
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

    context('when files the generator would write already exist', () => {
      beforeEach(() => {
        // real writes, into the temporary project root
        spy.mockRestore()
      })

      it('refuses, writes nothing, and names each existing file, --overwrite and --skip-existing', async () => {
        await writeProjectFile('test-app/app/models/Post.ts', 'hand-edited model')
        await writeProjectFile('test-app/spec/factories/PostFactory.ts', 'hand-edited factory')

        const error = await rejectionOf(
          DreamBin.generateDream('Post', ['title:string'], {
            serializer: true,
            stiBaseSerializer: false,
            connectionName: 'default',
          })
        )

        expect(error.message).toContain('test-app/app/models/Post.ts')
        expect(error.message).toContain('test-app/spec/factories/PostFactory.ts')
        expect(error.message).not.toContain('PostSerializer.ts')
        expect(error.message).not.toContain('Post.spec.ts')
        expect(error.message).toContain('--overwrite')
        expect(error.message).toContain('--skip-existing')
        expect(await projectFiles()).toEqual([
          'test-app/app/models/Post.ts',
          'test-app/spec/factories/PostFactory.ts',
        ])
        expect(await readProjectFile('test-app/app/models/Post.ts')).toEqual('hand-edited model')
      })

      it("refuses when only the model's create migration exists, naming it", async () => {
        await writeProjectFile('test-app/db/migrations/1700000000000-create-post.ts', 'original migration')

        const error = await rejectionOf(
          DreamBin.generateDream('Post', ['title:string'], {
            serializer: true,
            stiBaseSerializer: false,
            connectionName: 'default',
          })
        )

        expect(error.message).toContain('test-app/db/migrations/1700000000000-create-post.ts')
        expect(error.message).toContain('--overwrite')
        expect(await projectFiles()).toEqual(['test-app/db/migrations/1700000000000-create-post.ts'])
      })

      it("generates every file when the only migrations are other tables' create migrations", async () => {
        await writeProjectFile('test-app/db/migrations/1700000000000-create-posts.ts', 'other table')
        await writeProjectFile('test-app/db/migrations/1700000000001-create-post-comments.ts', 'other table')

        await DreamBin.generateDream('Post', ['title:string'], {
          serializer: true,
          stiBaseSerializer: false,
          connectionName: 'default',
        })

        const files = await projectFiles()
        expect(files).toContain('test-app/app/models/Post.ts')
        expect(files).toContain('test-app/spec/unit/models/Post.spec.ts')
        expect(files).toContain('test-app/spec/factories/PostFactory.ts')
        expect(files).toContain('test-app/app/serializers/PostSerializer.ts')
        expect(
          files.filter(file => /^test-app\/db\/migrations\/\d+-create-post\.ts$/.test(file))
        ).toHaveLength(1)
      })

      context('with overwrite', () => {
        it('rewrites the existing model, spec, factory and serializer', async () => {
          await writeProjectFile('test-app/app/models/Post.ts', 'hand-edited model')
          await writeProjectFile('test-app/spec/unit/models/Post.spec.ts', 'hand-edited spec')
          await writeProjectFile('test-app/spec/factories/PostFactory.ts', 'hand-edited factory')
          await writeProjectFile('test-app/app/serializers/PostSerializer.ts', 'hand-edited serializer')

          await DreamBin.generateDream('Post', ['title:string'], {
            serializer: true,
            stiBaseSerializer: false,
            connectionName: 'default',
            existingFiles: 'overwrite',
          })

          expect(await readProjectFile('test-app/app/models/Post.ts')).toContain('export default class Post')
          expect(await readProjectFile('test-app/spec/unit/models/Post.spec.ts')).toContain("describe('Post'")
          expect(await readProjectFile('test-app/spec/factories/PostFactory.ts')).toContain('createPost')
          expect(await readProjectFile('test-app/app/serializers/PostSerializer.ts')).toContain(
            'PostSerializer'
          )
          expect(
            (await projectFiles()).filter(file =>
              /^test-app\/db\/migrations\/\d+-create-post\.ts$/.test(file)
            )
          ).toHaveLength(1)
        })

        it('keeps an existing create migration, writes no second one, and says it kept it', async () => {
          const logged: string[] = []
          vi.spyOn(DreamCLI.logger, 'log').mockImplementation((text: string) => {
            logged.push(text)
          })
          await writeProjectFile('test-app/app/models/Post.ts', 'hand-edited model')
          await writeProjectFile('test-app/db/migrations/1700000000000-create-post.ts', 'original migration')

          await DreamBin.generateDream('Post', ['title:string'], {
            serializer: true,
            stiBaseSerializer: false,
            connectionName: 'default',
            existingFiles: 'overwrite',
          })

          expect(await readProjectFile('test-app/app/models/Post.ts')).toContain('export default class Post')
          expect((await projectFiles()).filter(file => file.startsWith('test-app/db/migrations/'))).toEqual([
            'test-app/db/migrations/1700000000000-create-post.ts',
          ])
          expect(await readProjectFile('test-app/db/migrations/1700000000000-create-post.ts')).toEqual(
            'original migration'
          )
          expect(logged.join('\n')).toMatch(/kept.*test-app\/db\/migrations\/1700000000000-create-post\.ts/)
        })
      })

      context('with skip', () => {
        it('writes only the missing files, leaves the existing ones byte-identical, and reports each kept file', async () => {
          const logged: string[] = []
          vi.spyOn(DreamCLI.logger, 'log').mockImplementation((text: string) => {
            logged.push(text)
          })
          await writeProjectFile('test-app/spec/unit/models/Post.spec.ts', 'hand-edited spec')
          await writeProjectFile('test-app/app/serializers/PostSerializer.ts', 'hand-edited serializer')

          await DreamBin.generateDream('Post', ['title:string'], {
            serializer: true,
            stiBaseSerializer: false,
            connectionName: 'default',
            existingFiles: 'skip',
          })

          expect(await readProjectFile('test-app/spec/unit/models/Post.spec.ts')).toEqual('hand-edited spec')
          expect(await readProjectFile('test-app/app/serializers/PostSerializer.ts')).toEqual(
            'hand-edited serializer'
          )
          expect(await readProjectFile('test-app/app/models/Post.ts')).toContain('export default class Post')
          expect(await readProjectFile('test-app/spec/factories/PostFactory.ts')).toContain('createPost')
          expect(
            (await projectFiles()).filter(file =>
              /^test-app\/db\/migrations\/\d+-create-post\.ts$/.test(file)
            )
          ).toHaveLength(1)
          expect(logged).toContain('[dream] kept existing spec: test-app/spec/unit/models/Post.spec.ts')
          expect(logged).toContain(
            '[dream] kept existing serializer: test-app/app/serializers/PostSerializer.ts'
          )
        })

        it('writes no migration when the model file exists, even though no create migration matches, and says so', async () => {
          const logged: string[] = []
          vi.spyOn(DreamCLI.logger, 'log').mockImplementation((text: string) => {
            logged.push(text)
          })
          await writeProjectFile('test-app/app/models/Post.ts', 'hand-edited model')
          await writeProjectFile(
            'test-app/db/migrations/1700000000000-create-posts.ts',
            'hand-named migration'
          )

          await DreamBin.generateDream('Post', ['title:string'], {
            serializer: true,
            stiBaseSerializer: false,
            connectionName: 'default',
            existingFiles: 'skip',
          })

          expect(await readProjectFile('test-app/app/models/Post.ts')).toEqual('hand-edited model')
          expect((await projectFiles()).filter(file => file.startsWith('test-app/db/migrations/'))).toEqual([
            'test-app/db/migrations/1700000000000-create-posts.ts',
          ])
          expect(logged).toContain('[dream] kept existing dream: test-app/app/models/Post.ts')
          expect(logged.join('\n')).toMatch(
            /skipped migration.*test-app\/app\/models\/Post\.ts already exists/
          )
        })

        it('keeps an existing create migration and reports it as kept', async () => {
          const logged: string[] = []
          vi.spyOn(DreamCLI.logger, 'log').mockImplementation((text: string) => {
            logged.push(text)
          })
          await writeProjectFile('test-app/db/migrations/1700000000000-create-post.ts', 'original migration')

          await DreamBin.generateDream('Post', ['title:string'], {
            serializer: true,
            stiBaseSerializer: false,
            connectionName: 'default',
            existingFiles: 'skip',
          })

          expect(await readProjectFile('test-app/app/models/Post.ts')).toContain('export default class Post')
          expect((await projectFiles()).filter(file => file.startsWith('test-app/db/migrations/'))).toEqual([
            'test-app/db/migrations/1700000000000-create-post.ts',
          ])
          expect(await readProjectFile('test-app/db/migrations/1700000000000-create-post.ts')).toEqual(
            'original migration'
          )
          expect(logged.join('\n')).toMatch(
            /kept existing migration: test-app\/db\/migrations\/1700000000000-create-post\.ts/
          )
        })
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

    it('rejects belongs_to columns before writing files', async () => {
      await expect(
        DreamBin.generateStiChild('Room/Kitchen', 'Room', ['User:belongs_to'], {
          serializer: true,
          connectionName: 'default',
        })
      ).rejects.toThrow(
        'STI children cannot declare belongs_to associations. Declare associations on the STI parent instead. Unsupported columns: User:belongs_to'
      )

      expect(spy).not.toHaveBeenCalled()
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

    context("when the child's files already exist", () => {
      beforeEach(() => {
        // real writes, into the temporary project root
        spy.mockRestore()
      })

      it("refuses, writes nothing, and names the existing model and the child's migration", async () => {
        await writeProjectFile('test-app/app/models/Room/Kitchen.ts', 'hand-edited child')
        await writeProjectFile('test-app/db/migrations/1700000000000-create-room-kitchen.ts', 'original')

        const error = await rejectionOf(
          DreamBin.generateStiChild('Room/Kitchen', 'Room', ['oven_count:integer'], {
            serializer: true,
            connectionName: 'default',
          })
        )

        expect(error.message).toContain('test-app/app/models/Room/Kitchen.ts')
        expect(error.message).toContain('test-app/db/migrations/1700000000000-create-room-kitchen.ts')
        expect(error.message).toContain('--overwrite')
        expect(await projectFiles()).toEqual([
          'test-app/app/models/Room/Kitchen.ts',
          'test-app/db/migrations/1700000000000-create-room-kitchen.ts',
        ])
      })

      it('with overwrite, rewrites the existing child model', async () => {
        await writeProjectFile('test-app/app/models/Room/Kitchen.ts', 'hand-edited child')

        await DreamBin.generateStiChild('Room/Kitchen', 'Room', [], {
          serializer: true,
          connectionName: 'default',
          existingFiles: 'overwrite',
        })

        expect(await readProjectFile('test-app/app/models/Room/Kitchen.ts')).toContain('@STI(Room)')
      })

      it("with skip, keeps the existing child model and writes neither a second model nor the child's migration", async () => {
        await writeProjectFile('test-app/app/models/Room/Kitchen.ts', 'hand-edited child')

        await DreamBin.generateStiChild('Room/Kitchen', 'Room', ['oven_count:integer'], {
          serializer: true,
          connectionName: 'default',
          existingFiles: 'skip',
        })

        expect(await readProjectFile('test-app/app/models/Room/Kitchen.ts')).toEqual('hand-edited child')
        expect(await readProjectFile('test-app/spec/factories/Room/KitchenFactory.ts')).toContain(
          'createRoomKitchen'
        )
        expect((await projectFiles()).filter(file => file.startsWith('test-app/db/migrations/'))).toEqual([])
      })
    })

    context('when no connectionName is given', () => {
      it("writes the migration to the parent model's connection folder", async () => {
        await DreamBin.generateStiChild(
          'AlternateDbConnectionUser/Admin',
          'AlternateDbConnectionUser',
          ['level:integer'],
          { serializer: true }
        )

        const migration = findWritten('migration')!
        expect(migration.basePath).toMatch(/migrations\/alternateConnection$/)
        expect(migration.content).toContain("alterTable('alternate_db_connection_users')")
      })

      it('rejects a parent that is not one of the app models, before writing files', async () => {
        await expect(
          DreamBin.generateStiChild('Room/Kitchen', 'Room', ['oven_count:integer'], { serializer: true })
        ).rejects.toThrow(
          'Cannot generate the STI child Room/Kitchen: its parent, Room, is not one of the app models.'
        )

        expect(spy).not.toHaveBeenCalled()
      })
    })
  })
})
