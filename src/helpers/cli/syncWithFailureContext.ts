import DreamCLI from '../../cli/index.js'

export interface SyncFailureContext {
  /**
   * The command the sync is running on behalf of, e.g. `db:rollback`.
   */
  commandName: string

  /**
   * What the command finished before the sync ran, written as a sentence with
   * no trailing period, e.g. `The rollback completed successfully`. It must
   * only claim the steps that genuinely ran to completion — for a command
   * whose sync sits in the middle of a sequence, name those steps rather than
   * the command as a whole.
   */
  completedWork: string

  /**
   * What the sync failure prevented from running, written as a clause with no
   * trailing period, e.g. `db:seed did not run`. Omit it when the sync is the
   * last thing the command does, in which case nothing was skipped.
   */
  didNotRun?: string | undefined
}

/**
 * Runs the type/schema sync a command performs after its own work has already
 * succeeded, and — when that sync fails — logs a message naming what completed
 * and naming the sync as the step that failed, before re-raising the original
 * error untouched.
 *
 * Without this, a failing sync surfaces a bare sync error immediately after
 * e.g. `db:rollback`, which reads as a failed rollback even though the
 * rollback itself is already committed.
 *
 * The original error is re-thrown rather than wrapped, so the error a caller
 * sees, and the command's non-zero exit status, are exactly what they were
 * before. Callers keep their own `EnvInternal.isTest` / `--skip-sync` guards:
 * this wrapper takes the sync call, not the decision to make it.
 */
export default async function syncWithFailureContext(
  { commandName, completedWork, didNotRun }: SyncFailureContext,
  sync: () => Promise<void>
): Promise<void> {
  try {
    await sync()
  } catch (error) {
    DreamCLI.logger.log(syncFailureMessage({ commandName, completedWork, didNotRun }))
    throw error
  }
}

/**
 * @internal
 *
 * Builds the explanatory message logged when a post-work sync fails.
 */
export function syncFailureMessage({ commandName, completedWork, didNotRun }: SyncFailureContext): string {
  const skipped = didNotRun ? `; ${didNotRun}` : ''

  return `
${commandName}: the sync step failed — not ${commandName}'s own work.

${completedWork}. What failed afterward is the sync that ${commandName} runs to regenerate the auto-generated type and schema files${skipped}.

The error below was raised by that sync. Once it is resolved, re-run \`${commandName}\`, or run \`sync\` on its own.
`
}
