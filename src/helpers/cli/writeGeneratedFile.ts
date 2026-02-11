import * as fs from 'node:fs/promises'
import DreamCLI from '../../cli/index.js'
import dreamFileAndDirPaths from '../path/dreamFileAndDirPaths.js'
import dreamPath, { type DreamPaths } from '../path/dreamPath.js'

export interface WriteGeneratedFileArgs {
  /** The dream path key (e.g. 'models', 'serializers'). Mutually exclusive with basePath. */
  dreamPathKey?: DreamPaths | undefined
  /** An explicit base directory path. Mutually exclusive with dreamPathKey. */
  basePath?: string | undefined
  /** The file name relative to the base path (e.g. 'User.ts', 'UserSerializer.ts') */
  fileName: string
  /** The generated file content */
  content: string
  /** Label for CLI output (e.g. 'dream', 'serializer', 'factory', 'spec', 'migration') */
  logLabel: string
}

/**
 * Common file-writing helper used by all Dream generators.
 * Handles directory creation, file writing, logging, and error wrapping.
 */
export default async function writeGeneratedFile({
  dreamPathKey,
  basePath,
  fileName,
  content,
  logLabel,
}: WriteGeneratedFileArgs): Promise<void> {
  const resolvedBasePath = basePath ?? dreamPath(dreamPathKey!)
  const { relFilePath, absDirPath, absFilePath } = dreamFileAndDirPaths(resolvedBasePath, fileName)

  try {
    DreamCLI.logger.log(`[dream] generating ${logLabel}: ${relFilePath}`)
    await fs.mkdir(absDirPath, { recursive: true })
    await fs.writeFile(absFilePath, content)
  } catch (error) {
    throw new Error(`
      Something happened while trying to create the ${logLabel} file:
        ${relFilePath}

      Does this file already exist? Here is the error that was raised:
        ${(error as Error).message}
    `)
  }
}
