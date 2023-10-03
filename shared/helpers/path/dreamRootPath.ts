import path from 'path'

export default function dreamRootPath({
  filepath,
  omitDirname,
}: { filepath?: string; omitDirname?: boolean } = {}) {
  if (!process.env.APP_ROOT_PATH)
    throw `
    ATTENTION!: Must set APP_ROOT_PATH env var to your project root
  `
  if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
    return path.join(process.env.APP_ROOT_PATH!, '..', filepath || '')
  } else if (process.env.PSYCHIC_CORE_DEVELOPMENT === '1') {
    return path.join(process.env.APP_ROOT_PATH!, '..', 'node_modules/@rvohealth/dream', filepath || '')
  } else {
    return path.join(process.env.APP_ROOT_PATH!, 'node_modules/@rvohealth/dream', filepath || '')
  }
}
