export default async function executeDatabaseQuery<
  Command extends DbQueryCommand,
  ReturnType extends ExecuteDatabaseQueryReturnType<Command>,
>(kyselyQuery: any, command: Command): Promise<ReturnType> {
  return await kyselyQuery[command]()
}

export type DbQueryCommand = 'execute' | 'executeTakeFirst' | 'executeTakeFirstOrThrow'

export type ExecuteDatabaseQueryReturnType<Command extends DbQueryCommand> = Command extends 'execute'
  ? any[]
  : Command extends 'executeTakeFirst'
    ? any
    : Command extends 'executeTakeFirstOrThrow'
      ? any
      : never
