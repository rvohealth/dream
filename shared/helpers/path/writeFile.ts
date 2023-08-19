import { promises as fs } from 'fs'

export default async function writeFile(filepath: string, contents: string) {
  return await fs.writeFile(filepath, contents)
}
