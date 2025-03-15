import DreamApplication from '../../dream-application/index.js.js'
import EnvInternal from '../../helpers/EnvInternal.js.js'

export default async function executeDatabaseQuery<
  Command extends 'execute' | 'executeTakeFirst' | 'executeTakeFirstOrThrow',
  ReturnType extends Command extends 'execute'
    ? any[]
    : Command extends 'executeTakeFirst'
      ? any
      : Command extends 'executeTakeFirstOrThrow'
        ? any
        : never,
>(kyselyQuery: any, command: Command): Promise<ReturnType> {
  try {
    return await kyselyQuery[command]()
  } catch (error) {
    if (EnvInternal.isDebug) {
      const sqlString = kyselyQuery.compile().sql
      const paramsString = kyselyQuery.compile().parameters.join(', ')

      DreamApplication.logWithLevel(
        'error',
        `Error executing the following SQL:
${(error as Error).message}

${sqlString}
[ ${paramsString} ]
NOTE: to turn this message off, remove the DEBUG=1 env variable`
      )
    }
    // throw the original error to maintain stack trace
    throw error
  }
}
