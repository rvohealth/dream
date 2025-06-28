import * as fs from 'node:fs/promises'
import DreamCLI from './index.js'

export class CliFileWriter {
  public static async write(filepath: string, contents: string) {
    await cliFileWriter.write(filepath, contents)
  }

  public static async revert() {
    await cliFileWriter.revert()
  }

  public static async cache(filepath: string) {
    await cliFileWriter.cache(filepath)
  }

  private fileCache: Record<string, string> = {}

  public async write(filepath: string, contents: string) {
    // if we have manually backed up this file, or else this file
    // has been written to twice in one CLI session, we want
    // to preserve the original backup, so we do not attempt
    // to cache a second time
    if (!this.fileCache[filepath]) await this.cache(filepath)

    await fs.writeFile(filepath, contents)
  }

  public async revert() {
    const filepaths = Object.keys(this.fileCache)
    for (const filepath of filepaths) {
      DreamCLI.logger.logContinueProgress(`reverting ${filepath}`)
      await fs.writeFile(filepath, this.fileCache[filepath]!)
    }
  }

  public async cache(filepath: string) {
    const originalContents = (await fs.readFile(filepath)).toString()
    this.fileCache[filepath] = originalContents
  }
}

const cliFileWriter = new CliFileWriter()
