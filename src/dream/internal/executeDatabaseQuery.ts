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
  const debugging = process.env.DEBUG === '1'
  const sqlString = debugging ? kyselyQuery.compile().sql : null
  const paramsString = debugging ? kyselyQuery.compile().parameters.join(', ') : null

  const sqlDebugMessage = debugging
    ? `
      ${sqlString}
      [ ${paramsString} ]
      NOTE: to turn this message off, remove the DEBUG=1 env variable
    `
    : null

  try {
    if (debugging) {
      console.log(
        `
            About to execute the following SQL:
            ${sqlDebugMessage}
          `
      )
    }

    return await kyselyQuery[command]()
  } catch (error) {
    if (debugging) {
      console.error(`
          Error executing the following SQL:
          ${(error as Error).message}

          ${sqlDebugMessage}
        `)
    }
    // throw the original error to maintain stack trace
    throw error
  }
}
