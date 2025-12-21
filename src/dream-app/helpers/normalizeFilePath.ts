export default function normalizeFilePath(filepath: string) {
  return filepath.replace(/\\/g, '/')
}
