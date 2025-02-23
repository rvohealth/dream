import { ComparisonOperatorExpression as KyselyComparisonOperatorExpression } from 'kysely'
import { TRIGRAM_OPERATORS, TrigramOperator } from '../dream/types'
import ScoreMustBeANormalNumber from '../errors/ops/ScoreMustBeANormalNumber'

export interface ExtraOpsArgs {
  negated?: boolean
}
export interface ExtraSimilarityArgs extends ExtraOpsArgs {
  score?: number
}

export default class OpsStatement<
  COE extends KyselyComparisonOperatorExpression | TrigramOperator,
  ExtraArgs extends COE extends '%' | '<%' | '<<%'
    ? ExtraSimilarityArgs | undefined
    : ExtraOpsArgs | undefined = ExtraOpsArgs | undefined,
> {
  public operator: COE
  public value: any
  public extraArgs: ExtraArgs
  public negated: boolean = false

  constructor(operator: COE, value: any, extraArgs?: ExtraArgs) {
    if (
      typeof (extraArgs as ExtraSimilarityArgs)?.score === 'number' &&
      ((extraArgs as ExtraSimilarityArgs).score! < 0 || (extraArgs as ExtraSimilarityArgs).score! > 1)
    ) {
      throw new ScoreMustBeANormalNumber((extraArgs as ExtraSimilarityArgs).score!)
    }

    this.operator = operator
    this.value = value

    if (extraArgs) {
      this.extraArgs = extraArgs
      this.negated = extraArgs?.negated || false
    }
  }

  public get isOpsStatement() {
    return true
  }

  public get shouldBypassWhereStatement() {
    return TRIGRAM_OPERATORS.includes(this.operator as any)
  }

  public get minTrigramScore() {
    if (TRIGRAM_OPERATORS.includes(this.operator as any)) {
      return (this.extraArgs as ExtraSimilarityArgs)?.score
    } else {
      return null
    }
  }
}
