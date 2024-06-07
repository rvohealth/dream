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
    if (process.env.DEBUG === '1') {
      const sqlString = kyselyQuery.compile().sql
      const paramsString = kyselyQuery.compile().parameters.join(', ')

      console.error(`Error executing the following SQL:
${(error as Error).message}

${sqlString}
[ ${paramsString} ]
NOTE: to turn this message off, remove the DEBUG=1 env variable`)
    }
    // throw the original error to maintain stack trace
    throw error
  }
}
