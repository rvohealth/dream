import { ExpressionBuilder } from 'kysely';
import Dream from '../../../dream';
import OpsStatement from '../../../ops/ops-statement';
export default function similarityWhereSql<DreamInstance extends Dream>({ eb, tableName, columnName, opsStatement, schema, }: {
    eb: ExpressionBuilder<any, any>;
    tableName: DreamInstance['table'];
    columnName: string;
    opsStatement: OpsStatement<any, any>;
    schema: any;
}): any;
