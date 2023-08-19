import path from 'path'
import compact from '../compact'
import shouldOmitDistFolder from './shouldOmitDistFolder'

export function distPath({ filepath, omitDirname }: { filepath: string; omitDirname?: boolean }) {
  const dirname = omitDirname ? undefined : __dirname
  filepath = filepath.replace(/^dist\//, '')
  console.log('FILEPATH', shouldOmitDistFolder())

  if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
    return path.join(
      ...compact([dirname, '..', '..', '..', shouldOmitDistFolder() ? null : '..', 'dist', filepath])
    )
  } else {
    return path.join(
      ...compact([
        dirname,
        '..',
        '..',
        '..',
        '..',
        '..',
        shouldOmitDistFolder() ? null : '..',
        'dist',
        filepath,
      ])
    )
  }
}
