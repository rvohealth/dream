import path from 'path'
import setCoreDevelopmentFlag from './setCoreDevelopmentFlag'

export type TypescriptFileType = `${string}.ts`
export default function nodeOrTsnodeCmd(
  filePath: TypescriptFileType,
  programArgs: string[],
  { nodeFlags = [], fileArgs = [] }: { nodeFlags?: string[]; fileArgs?: string[] } = {}
) {
  const coreDevFlag = setCoreDevelopmentFlag(programArgs)
  const useTsnode = programArgs.includes('--tsnode') || process.env.TS_SAFE === '1'
  const nodeCmd = useTsnode ? 'npx ts-node' : 'node'
  const omitDistFromPathEnv = useTsnode ? 'DREAM_OMIT_DIST_FOLDER=1 ' : ''
  const realFilePath = useTsnode ? filePath : path.join('dist', filePath.replace(/\.ts$/, '.js'))
  if (useTsnode) fileArgs.push('--tsnode')
  const nodeEnvFlag = process.env.NODE_ENV ? `NODE_ENV=${process.env.NODE_ENV} ` : ''

  return `${nodeEnvFlag}${coreDevFlag}${omitDistFromPathEnv}${nodeCmd} ${
    useTsnode ? '' : nodeFlags.join(' ')
  } ${realFilePath} ${fileArgs.join(' ')} `
}
