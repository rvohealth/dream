import path from 'path'
import setCoreDevelopmentFlag from './setCoreDevelopmentFlag'

export type TypescriptFileType = `${string}.ts`
export default function dreamOrTsdreamCmd(
  cmd: string,
  programArgs: string[],
  { cmdArgs = [] }: { cmdArgs?: string[] } = {}
) {
  const coreDevFlag = setCoreDevelopmentFlag(programArgs)
  const useTsnode = programArgs.includes('--tsnode')
  const dreamCmd = useTsnode ? 'tsdream' : 'dream'
  console.log('DREAMCMD:', dreamCmd)
  const omitDistFromPathEnv = useTsnode ? 'DREAM_OMIT_DIST_FOLDER=1 ' : ''
  const basepath = process.env.DREAM_CORE_DEVELOPMENT === '1' ? '' : '../../'
  if (useTsnode) cmdArgs.push('--tsnode')
  return `${coreDevFlag}${omitDistFromPathEnv}yarn --cwd=${basepath}node_modules/dream ${dreamCmd} ${cmd} ${cmdArgs.join(
    ' '
  )} `
}
