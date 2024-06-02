import './loadEnv'
import repl from 'node:repl'
import fs from 'fs/promises'
import path from 'path'
import { modelsPath } from '../../../src/helpers/path'
import importFileWithDefault from '../../../src/helpers/importFileWithDefault'

const replServer = repl.start('> ')
export default (async function () {
  const dreamPaths = (await getFiles(await modelsPath())).filter(filename => /\.ts$/.test(filename))
  for (const dreamPath of dreamPaths) {
    const DreamClass = await importFileWithDefault(dreamPath)
    replServer.context[DreamClass.name] = DreamClass
  }
})()

async function getFiles(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    dirents.map(dirent => {
      const res = path.resolve(dir, dirent.name)
      return dirent.isDirectory() ? getFiles(res) : res
    })
  )
  return Array.prototype.concat(...files)
}
