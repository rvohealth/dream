import path from 'path'

export default function projectRootPath({
  filepath,
  omitDirname,
}: { filepath?: string; omitDirname?: boolean } = {}) {
  if (!process.env.APP_ROOT_PATH)
    throw `
    ATTENTION!: Must set APP_ROOT_PATH env var to your project root
  `
  return path.join(process.env.APP_ROOT_PATH!, '..', filepath || '')
}
