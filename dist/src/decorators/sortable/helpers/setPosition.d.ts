import { SelectQueryBuilder, UpdateQueryBuilder } from 'kysely';
import Dream from '../../../dream';
import Query from '../../../dream/query';
import DreamTransaction from '../../../dream/transaction';
export default function setPosition({ position, previousPosition, dream, positionField, scope, query, txn, }: {
    dream: Dream;
    position: number;
    previousPosition?: number;
    positionField: string;
    query: Query<Dream>;
    scope?: string | string[];
    txn?: DreamTransaction<any>;
}): Promise<void>;
export declare function applySortableScopesToQuery<QB extends UpdateQueryBuilder<any, string, string, any> | SelectQueryBuilder<any, any, any>>(dream: Dream, kyselyQuery: QB, whereValueCB: (column: string) => any, scope?: string | string[]): QB;
