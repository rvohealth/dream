import { promises as fs } from 'fs'

export default async function loadFile(filepath: string) {
  return await fs.readFile(filepath)
}
