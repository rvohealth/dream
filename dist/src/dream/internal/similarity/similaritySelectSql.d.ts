import { ExpressionBuilder } from 'kysely';
import Dream from '../../../dream';
import OpsStatement from '../../../ops/ops-statement';
export default function similaritySelectSql<DreamInstance extends Dream>({ eb, tableName, columnName, opsStatement, schema, rankSQLAlias, }: {
    eb: ExpressionBuilder<DreamInstance['DB'], string | (any extends keyof DreamInstance['DB'] ? any : never)>;
    tableName: DreamInstance['table'];
    columnName: string;
    opsStatement: OpsStatement<any, any>;
    schema: any;
    rankSQLAlias: string;
}): import("kysely").AliasedRawBuilder<string, string>;
