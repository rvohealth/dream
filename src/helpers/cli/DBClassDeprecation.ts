import * as fsSync from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import DreamCLI from '../../cli/index.js'
import DreamApp from '../../dream-app/index.js'

/**
 * Originally, psychic-workers tapped into the types produced by psychic,
 * modifying the psychicTypes to include type configurations for workers
 * as well. Since Psychic no longer supports this method of augmenting
 * types, psychic-workers has been refactored to produce its own types
 * file.
 *
 * This service is responsible for identifying applications that are still
 * reliant on the types produced by psychic, and refactoring them so that their
 * imports are now in the correct places.
 */
export default class DBClassDeprecation {
  public async deprecate() {
    const dreamApp = DreamApp.getOrFail()
    if (dreamApp.bypassDeprecationChecks) return

    const files = [
      path.join(process.cwd(), DreamApp.system.dreamPath('models'), 'ApplicationModel.ts'),
      path.join(process.cwd(), DreamApp.system.dreamPath('models'), 'ApplicationBackgroundedModel.ts'),
    ]

    try {
      for (const file of files) {
        const exists = fsSync.existsSync(file)
        if (!exists) continue

        const fileContent = (await fs.readFile(file)).toString()
        if (fileContent.includes('DBClass')) {
          await DreamCLI.logger.logProgress(
            `[dream] patching deprecated DBClass type for ${file.split(path.sep).at(-1)}`,
            async () => {
              await fs.writeFile(file, fileContent.replace(/DBClass/g, 'DB'))
            }
          )
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)

      // eslint-disable-next-line no-console
      console.log(`
ATTENTION: 

The dream package has formally deprecated the DBClass export from all dream schema files. Any usage
of the DBClass export throughout your app should be replaced with the "DB" export, which provides an
identical structure to the original DBClass export.

An automated script is meant to manually catch and fix this for you any time you sync, but for some
reason it failed. Make sure to replace all DBClass imports throughout your app with the DB export, like so:

import { DB } from '@src/types/db.js'

export default class ApplicationModel extends Dream {
  declare public DB: DB
  ...
}
`)
    }
  }
}
