// trying to standardize on a single way of importing files based on
// if DREAM_CORE_DEVELOPMENT=1. Currently, we do it several ways, but this
// would be the most stable moving forward, especially if we ever decide to
// build to dist, since directory structures morph in those contexts.
import path from 'path'

export default function absoluteFilePath(filePath: string) {
  return process.env.DREAM_CORE_DEVELOPMENT === '1'
    ? path.join(process.cwd(), filePath)
    : path.join(process.cwd(), '..', '..', filePath)
}
