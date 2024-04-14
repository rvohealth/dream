export default async function importFile(filepath: string) {
  return await import(filepath)
}
