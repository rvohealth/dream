import * as repl from 'node:repl'
import * as fs from 'fs/promises'
import * as path from 'path'
import { loadDreamYamlFile } from '../../src/helpers/path'

const replServer = repl.start('> ')
export default (async function () {
  const yamlConf = await loadDreamYamlFile()
  const dreamPaths = await getFiles(
    process.env.CORE_DEVELOPMENT === '1' ? `./${yamlConf.models_path}` : `../../${yamlConf.models_path}`
  )
  for (const dreamPath of dreamPaths) {
    const DreamClass = (await import(dreamPath)).default
    replServer.context[(DreamClass as any).name] = DreamClass
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
