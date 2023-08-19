import setCoreDevelopmentFlag from './setCoreDevelopmentFlag'

export type TypescriptFileType = `${string}.ts`
export default function dreamOrDreamtsCmd(
  cmd: string,
  programArgs: string[],
  { cmdArgs = [] }: { cmdArgs?: string[] } = {}
) {
  const coreDevFlag = setCoreDevelopmentFlag(programArgs)
  const useTsnode = programArgs.includes('--tsnode') || process.env.TS_SAFE === '1'
  const dreamCmd = useTsnode ? dreamtscmd() : 'dream'
  const omitDistFromPathEnv = useTsnode ? 'DREAM_OMIT_DIST_FOLDER=1 ' : ''
  const basepath = process.env.DREAM_CORE_DEVELOPMENT === '1' ? '' : '../../'
  if (useTsnode) cmdArgs.push('--tsnode')

  const fullcmd = `${coreDevFlag}${omitDistFromPathEnv}yarn --cwd=${basepath}node_modules/dream ${dreamCmd} ${cmd} ${cmdArgs.join(
    ' '
  )} `

  return fullcmd
}

export function dreamtscmd() {
  return process.env.DREAM_CORE_DEVELOPMENT === '1' ? 'dreamts-core' : 'dreamts'
}
