import { ComparisonOperatorExpression as KyselyComparisonOperatorExpression } from 'kysely'
import ScoreMustBeANormalNumber from '../errors/ops/ScoreMustBeANormalNumber.js'
import { TRIGRAM_OPERATORS, TrigramOperator } from '../types/dream.js'

export interface ExtraSimilarityArgs {
  score?: number
}

export default class OpsStatement<
  COE extends KyselyComparisonOperatorExpression | TrigramOperator,
  ValType,
  ExtraArgs = COE extends '%' | '<%' | '<<%' ? ExtraSimilarityArgs | undefined : undefined,
> {
  constructor(
    public readonly operator: COE,
    public readonly value: ValType,
    public readonly extraArgs?: ExtraArgs
  ) {
    if (
      typeof (extraArgs as ExtraSimilarityArgs)?.score === 'number' &&
      ((extraArgs as ExtraSimilarityArgs).score! < 0 || (extraArgs as ExtraSimilarityArgs).score! > 1)
    ) {
      throw new ScoreMustBeANormalNumber((extraArgs as ExtraSimilarityArgs).score!)
    }

    this.operator = operator
    this.value = value

    if (extraArgs) {
      this.extraArgs = Object.freeze({ ...extraArgs })
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
