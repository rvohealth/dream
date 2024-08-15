import fs from 'fs/promises'
import path from 'path'

export default async function getFiles(dir: string): Promise<string[]> {
  try {
    const dirents = await fs.readdir(dir, { withFileTypes: true })
    const files = await Promise.all(
      dirents.map(dirent => {
        const res = path.resolve(dir, dirent.name)
        return dirent.isDirectory() ? getFiles(res) : res
      })
    )
    return Array.prototype.concat(...files)
  } catch (err) {
    if ((err as any).code === 'ENOENT') return []
    throw err
  }
}
