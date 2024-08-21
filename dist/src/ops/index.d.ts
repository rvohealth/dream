import Dream from '../dream';
import { ComparisonOperatorExpression } from '../dream/types';
import CurriedOpsStatement from './curried-ops-statement';
import OpsStatement from './ops-statement';
declare const ops: {
    expression: (operator: ComparisonOperatorExpression, value: any) => OpsStatement<ComparisonOperatorExpression, import("./ops-statement").ExtraOpsArgs | import("./ops-statement").ExtraSimilarityArgs | undefined>;
    in: (arr: any[]) => OpsStatement<"in", import("./ops-statement").ExtraOpsArgs | undefined>;
    any: (value: any) => CurriedOpsStatement<typeof Dream, any, string>;
    like: (like: string) => OpsStatement<"like", import("./ops-statement").ExtraOpsArgs | undefined>;
    ilike: (ilike: string) => OpsStatement<"ilike", import("./ops-statement").ExtraOpsArgs | undefined>;
    match: (match: string, { caseInsensitive }?: {
        caseInsensitive?: boolean;
    }) => OpsStatement<"~" | "~*", import("./ops-statement").ExtraOpsArgs | undefined>;
    equal: (equal: any) => OpsStatement<"=", import("./ops-statement").ExtraOpsArgs | undefined>;
    lessThan: (lessThan: number) => OpsStatement<"<", import("./ops-statement").ExtraOpsArgs | undefined>;
    lessThanOrEqualTo: (lessThanOrEqualTo: number) => OpsStatement<"<=", import("./ops-statement").ExtraOpsArgs | undefined>;
    greaterThan: (greaterThan: number) => OpsStatement<">", import("./ops-statement").ExtraOpsArgs | undefined>;
    greaterThanOrEqualTo: (greaterThanOrEqualTo: number) => OpsStatement<">=", import("./ops-statement").ExtraOpsArgs | undefined>;
    similarity: (similarity: string, { score }?: {
        score?: number;
    }) => OpsStatement<"%", {
        score: number;
    }>;
    wordSimilarity: (similarity: string, { score }?: {
        score?: number;
    }) => OpsStatement<"<%", {
        score: number;
    }>;
    strictWordSimilarity: (similarity: string, { score }?: {
        score?: number;
    }) => OpsStatement<"<<%", {
        score: number;
    }>;
    not: {
        in: (arr: any[]) => OpsStatement<"not in", {
            negated: true;
        }>;
        like: (like: string) => OpsStatement<"not like", {
            negated: true;
        }>;
        ilike: (ilike: string) => OpsStatement<"not ilike", {
            negated: true;
        }>;
        match: (match: string, { caseInsensitive }?: {
            caseInsensitive?: boolean;
        }) => OpsStatement<"!~" | "!~*", {
            negated: true;
        }>;
        equal: (equal: any) => OpsStatement<"!=", {
            negated: true;
        }>;
        lessThan: (lessThan: number) => OpsStatement<"!<", {
            negated: true;
        }>;
    };
};
export default ops;
