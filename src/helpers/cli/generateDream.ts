import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import DreamCLI from '../../cli/index.js'
import DreamApp from '../../dream-app/index.js'
import GeneratedFilesAlreadyExist, {
  type GeneratedFilesAlreadyExistFlags,
} from '../../errors/GeneratedFilesAlreadyExist.js'
import dreamFileAndDirPaths from '../path/dreamFileAndDirPaths.js'
import dreamPath from '../path/dreamPath.js'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName.js'
import generateDreamContent from './generateDreamContent.js'
import generateFactoryContent from './generateFactoryContent.js'
import { buildMigration, type GeneratedMigration } from './generateMigration.js'
import generateSerializerContent from './generateSerializerContent.js'
import generateUnitSpecContent from './generateUnitSpecContent.js'
import modelClassNameFrom from './modelClassNameFrom.js'
import writeGeneratedFile, { type WriteGeneratedFileArgs } from './writeGeneratedFile.js'

/**
 * What the model generators do when a file they would write already exists:
 * - `'refuse'`: write nothing and throw an error listing the existing files
 * - `'overwrite'`: replace the model, spec, factory and serializer files
 * - `'skip'`: keep every existing file and write only the missing ones
 *
 * An existing migration with the name the generator would give the model's
 * migration is never rewritten or duplicated, since it may already have run.
 * Under `'skip'`, no migration is written at all when the model file already
 * exists, since its table may have been created by a migration with another
 * name.
 */
export type GenerateDreamExistingFiles = 'refuse' | 'overwrite' | 'skip'

export interface GenerateDreamOptions {
  connectionName: string
  serializer: boolean
  stiBaseSerializer: boolean
  includeAdminSerializers: boolean
  includeInternalSerializers?: boolean
  tableName?: string | undefined
  modelName?: string | undefined
  /**
   * When true (and the generated model is NOT an STI child), decorates the
   * model with `@SoftDelete()` and auto-emits a nullable `deleted_at`
   * column in the migration and a `deletedAt` field on the model. Defaults
   * to false at this level — the CLI layer opts users in by default and
   * allows opt-out via `--no-soft-delete`.
   */
  softDelete?: boolean
  /**
   * What to do when a file the generator would write already exists.
   * Defaults to `'refuse'`. See {@link GenerateDreamExistingFiles}.
   */
  existingFiles?: GenerateDreamExistingFiles | undefined
  /**
   * The caller's flags that select `existingFiles: 'overwrite'` and
   * `existingFiles: 'skip'`, which the refusal names. Defaults to Dream's
   * `--overwrite` and `--skip-existing`.
   */
  existingFilesFlags?: GeneratedFilesAlreadyExistFlags | undefined
}

export default async function generateDream({
  fullyQualifiedModelName,
  columnsWithTypes,
  options,
  fullyQualifiedParentName,
}: {
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
  options: GenerateDreamOptions
  fullyQualifiedParentName?: string | undefined
}) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
  const modelClassName = modelClassNameFrom(fullyQualifiedModelName, options.modelName)
  const isSTI = !!fullyQualifiedParentName
  // `@SoftDelete()` is incompatible with STI children, so we force-disable
  // the soft-delete scaffold when generating an STI child regardless of the
  // caller-provided value.
  const softDelete = !isSTI && !!options.softDelete

  const modelFile: WriteGeneratedFileArgs = {
    dreamPathKey: 'models',
    fileName: `${fullyQualifiedModelName}.ts`,
    content: generateDreamContent({
      fullyQualifiedModelName,
      columnsWithTypes,
      fullyQualifiedParentName,
      serializer: options.serializer,
      includeAdminSerializers: options.includeAdminSerializers,
      includeInternalSerializers: options.includeInternalSerializers ?? false,
      connectionName: options.connectionName,
      tableName: options.tableName,
      modelClassName,
      softDelete,
    }),
    logLabel: 'dream',
  }

  const files: WriteGeneratedFileArgs[] = [
    modelFile,
    {
      dreamPathKey: 'modelSpecs',
      fileName: `${fullyQualifiedModelName}.spec.ts`,
      content: generateUnitSpecContent({ fullyQualifiedModelName }),
      logLabel: 'spec',
    },
    {
      dreamPathKey: 'factories',
      fileName: `${fullyQualifiedModelName}Factory.ts`,
      content: generateFactoryContent({ fullyQualifiedModelName, columnsWithTypes, modelClassName }),
      logLabel: 'factory',
    },
  ]

  if (options.serializer)
    files.push({
      dreamPathKey: 'serializers',
      fileName: `${fullyQualifiedModelName}Serializer.ts`,
      content: generateSerializerContent({
        fullyQualifiedModelName,
        columnsWithTypes,
        fullyQualifiedParentName,
        stiBaseSerializer: options.stiBaseSerializer,
        includeAdminSerializers: options.includeAdminSerializers,
        includeInternalSerializers: options.includeInternalSerializers ?? false,
        modelClassName,
      }),
      logLabel: 'serializer',
    })

  const migration =
    columnsWithTypes.length || !isSTI
      ? buildMigration({
          connectionName: options.connectionName,
          migrationName: `Create${fullyQualifiedModelName}`,
          columnsWithTypes,
          fullyQualifiedModelName,
          fullyQualifiedParentName,
          tableName: options.tableName,
          modelClassName,
          softDelete,
        })
      : undefined

  const existingFilesMode = options.existingFiles ?? 'refuse'

  const targets = await Promise.all(
    files.map(async file => {
      const { relFilePath, absFilePath } = dreamFileAndDirPaths(dreamPath(file.dreamPathKey!), file.fileName)
      return { file, relFilePath, exists: await fileExists(absFilePath) }
    })
  )
  const existingTargets = targets.filter(target => target.exists)
  const existingMigrations = migration ? await migrationsWithStem(migration) : []

  if (existingFilesMode === 'refuse' && (existingTargets.length || existingMigrations.length))
    throw new GeneratedFilesAlreadyExist(
      fullyQualifiedModelName,
      existingTargets.map(target => target.relFilePath),
      existingMigrations,
      options.existingFilesFlags
    )

  for (const target of targets) {
    if (target.exists && existingFilesMode === 'skip') {
      DreamCLI.logger.log(`[dream] kept existing ${target.file.logLabel}: ${target.relFilePath}`)
    } else {
      await writeGeneratedFile({ ...target.file, overwrite: existingFilesMode === 'overwrite' })
    }
  }

  const existingModel = existingTargets.find(target => target.file === modelFile)

  if (existingMigrations.length) {
    for (const existingMigration of existingMigrations)
      DreamCLI.logger.log(
        `[dream] kept existing migration: ${existingMigration} (no new migration written; edit it by hand if the columns changed)`
      )
  } else if (migration && existingFilesMode === 'skip' && existingModel) {
    DreamCLI.logger.log(
      `[dream] skipped migration: ${existingModel.relFilePath} already exists, so no migration was written (its schema may come from a migration with another name); generate one with g:migration if the schema needs to change`
    )
  } else if (migration) {
    await writeGeneratedFile({
      basePath: migration.basePath,
      fileName: migration.fileName,
      content: migration.content,
      logLabel: 'migration',
    })
  }
}

async function fileExists(absFilePath: string) {
  try {
    await fs.lstat(absFilePath)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
    throw error
  }
}

/**
 * The project-relative paths of the migrations in `migration`'s folder whose
 * file name differs from its own only in the version prefix. This reads the
 * folder, never the database: the generator cannot tell whether such a
 * migration has run, and a second one duplicates it either way.
 */
async function migrationsWithStem(migration: GeneratedMigration) {
  const suffix = `-${migration.fileStem}.ts`
  let fileNames: string[]
  try {
    fileNames = await fs.readdir(path.join(DreamApp.getOrFail().projectRoot, migration.basePath))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }

  return fileNames
    .filter(fileName => fileName.endsWith(suffix) && /^\d+$/.test(fileName.slice(0, -suffix.length)))
    .sort()
    .map(fileName => path.join(migration.basePath, fileName))
}
