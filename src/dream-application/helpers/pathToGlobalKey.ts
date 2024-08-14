const SAFE_PATH_LIMIT = 50000

export default function pathToGlobalKey(filepath: string, dirPath: string) {
  // Github security raises an exception here,
  // since the regex being used is apparantly
  // at risk of causing a DoS attack with long strings
  //
  // see https://github.com/rvohealth/dream/security/code-scanning/36
  if (dirPath.length > SAFE_PATH_LIMIT) {
    throw new Error(
      `
The path used is more than ${SAFE_PATH_LIMIT}. Dream cannot process paths
that are longer than ${SAFE_PATH_LIMIT} characters.`
    )
  }

  const prefixPath = dirPath.replace(/[^/]+\/?$/, '')
  return filepath.replace(prefixPath, '').replace(/\.[jt]s$/, '')
}
