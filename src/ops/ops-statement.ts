import { ComparisonOperatorExpression as KyselyComparisonOperatorExpression } from 'kysely'
import { TRIGRAM_OPERATORS, TrigramOperator } from '../dream/types'
import ScoreMustBeANormalNumber from '../errors/ops/ScoreMustBeANormalNumber'

export interface ExtraSimilarityArgs {
  score?: number
}

export default class OpsStatement<
  COE extends KyselyComparisonOperatorExpression | TrigramOperator,
  ValType,
  ExtraArgs = COE extends '%' | '<%' | '<<%' ? ExtraSimilarityArgs | undefined : undefined,
> {
  public operator: COE
  public value: ValType
  public extraArgs: ExtraArgs

  constructor(operator: COE, value: ValType, extraArgs?: ExtraArgs) {
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
