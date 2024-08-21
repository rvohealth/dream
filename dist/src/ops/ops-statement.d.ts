import { ComparisonOperatorExpression } from '../dream/types';
export interface ExtraOpsArgs {
    negated?: boolean;
}
export interface ExtraSimilarityArgs extends ExtraOpsArgs {
    score?: number;
}
export default class OpsStatement<COE extends ComparisonOperatorExpression, ExtraArgs extends COE extends '%' | '<%' | '<<%' ? ExtraSimilarityArgs | undefined : ExtraOpsArgs | undefined> {
    operator: ComparisonOperatorExpression;
    value: any;
    extraArgs: ExtraArgs;
    negated: boolean;
    constructor(operator: COE, value: any, extraArgs?: ExtraArgs);
    get isOpsStatement(): boolean;
    get shouldBypassWhereStatement(): boolean;
    get minTrigramScore(): number | null | undefined;
}
