import normalizeFilePath from '../../dream-app/helpers/normalizeFilePath.js'
import convertToFileURL from './convertToFileURL.js'

export default class PathHelpers {
  /**
   * converts a filepath with windows path delimiters into a path with linux/unix path delimiters
   *
   * ```ts
   * PathHelpers.normalize("\My\Path\To\File.ts")
   * // "/My/Path/To/File.ts"
   * ```
   *
   * @param filepath - string
   * @returns the same filepath, with any windows path delimiters replaced to their linux/unix counterparts
   */
  public static normalize(filepath: string) {
    return normalizeFilePath(filepath)
  }

  /**
   * uses node's pathToFileURL to convert filepaths
   *
   * @param filepath - string
   * @returns the filepath, converted using pathToFileURL, returning the href property
   */
  public static fileUrl(filepath: string) {
    return convertToFileURL(filepath)
  }
}
